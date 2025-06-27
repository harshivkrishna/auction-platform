import { Auction, Participant, Bid, VoiceCommand, AuctionItem } from '../types/auction';

class AuctionService {
  private auctions = new Map<string, Auction>();
  private participants = new Map<string, Participant>();
  private websockets = new Map<string, WebSocket>();

  // Generate unique 6-digit auction code
  generateAuctionCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create new auction
  createAuction(auctioneer: Participant, item: AuctionItem, duration: number = 30): Auction {
    const auctionId = `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const code = this.generateAuctionCode();
    
    const auction: Auction = {
      id: auctionId,
      code,
      title: `Auction: ${item.title}`,
      item,
      auctioneer,
      participants: new Map([[auctioneer.id, auctioneer]]),
      bids: [],
      status: 'waiting',
      duration,
      minBidIncrement: Math.max(item.startingPrice * 0.05, 50), // 5% or $50 minimum
      voiceCommands: [],
      transcriptionLog: [],
      concurrencyQueue: []
    };

    this.auctions.set(auctionId, auction);
    return auction;
  }

  // Join auction with code
  joinAuction(code: string, participant: Participant): Auction | null {
    const auction = Array.from(this.auctions.values())
      .find(a => a.code === code);
    
    if (!auction) return null;
    
    auction.participants.set(participant.id, participant);
    this.participants.set(participant.id, participant);
    
    this.broadcastToAuction(auction.id, {
      type: 'participant_joined',
      auctionId: auction.id,
      participantId: participant.id,
      data: participant,
      timestamp: new Date()
    });

    return auction;
  }

  // Process voice command with concurrency handling
  async processVoiceCommand(auctionId: string, command: VoiceCommand): Promise<boolean> {
    const auction = this.auctions.get(auctionId);
    if (!auction) return false;

    // Add to concurrency queue with timestamp for ordering
    const queueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      command,
      processed: false
    };
    
    auction.concurrencyQueue.push(queueItem);
    
    // Sort queue by timestamp to ensure proper ordering
    auction.concurrencyQueue.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Process queue in order
    return this.processCommandQueue(auction);
  }

  // Process command queue with proper concurrency handling
  private async processCommandQueue(auction: Auction): Promise<boolean> {
    const unprocessedCommands = auction.concurrencyQueue
      .filter(item => !item.processed)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (const queueItem of unprocessedCommands) {
      const { command } = queueItem;
      
      // Mark as processed immediately to prevent double processing
      queueItem.processed = true;
      
      // Add to voice commands log
      auction.voiceCommands.push(command);
      
      // Add transcription to log
      auction.transcriptionLog.push({
        id: `transcript_${Date.now()}`,
        participantId: command.participantId,
        participantName: command.participantName,
        text: command.transcription,
        timestamp: command.timestamp,
        confidence: command.confidence
      });

      // Process based on intent
      let processed = false;
      
      switch (command.intent) {
        case 'bid':
          processed = await this.processBidCommand(auction, command);
          break;
        case 'repeat':
          processed = await this.processRepeatCommand(auction, command);
          break;
        case 'leave':
          processed = await this.processLeaveCommand(auction, command);
          break;
        case 'end_auction':
          if (command.participantId === auction.auctioneer.id) {
            processed = await this.processEndAuctionCommand(auction, command);
          }
          break;
      }

      // Broadcast command processing result
      this.broadcastToAuction(auction.id, {
        type: 'command_processed',
        auctionId: auction.id,
        participantId: command.participantId,
        data: { command, processed },
        timestamp: new Date()
      });

      // Always broadcast transcription
      this.broadcastToAuction(auction.id, {
        type: 'transcription',
        auctionId: auction.id,
        participantId: command.participantId,
        data: {
          participantName: command.participantName,
          text: command.transcription,
          confidence: command.confidence
        },
        timestamp: new Date()
      });
    }

    return true;
  }

  // Process bid command
  private async processBidCommand(auction: Auction, command: VoiceCommand): Promise<boolean> {
    if (!command.extractedValue || command.extractedValue <= 0) return false;

    const bidAmount = command.extractedValue;
    const currentHighest = auction.currentBid?.amount || auction.item.startingPrice;
    const minimumBid = currentHighest + auction.minBidIncrement;

    // Validate bid amount
    if (bidAmount < minimumBid) {
      return false;
    }

    // Create new bid
    const bid: Bid = {
      id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bidderId: command.participantId,
      bidderName: command.participantName,
      amount: bidAmount,
      timestamp: command.timestamp,
      confidence: command.confidence,
      transcription: command.transcription,
      voiceCommand: command.command,
      status: 'accepted',
      processingOrder: auction.bids.length
    };

    // Mark previous bids as superseded
    auction.bids.forEach(b => {
      if (b.status === 'accepted') {
        b.status = 'superseded';
      }
    });

    // Add new bid
    auction.bids.push(bid);
    auction.currentBid = bid;

    // Broadcast new bid
    this.broadcastToAuction(auction.id, {
      type: 'new_bid',
      auctionId: auction.id,
      participantId: command.participantId,
      data: bid,
      timestamp: new Date()
    });

    return true;
  }

  // Process repeat command
  private async processRepeatCommand(auction: Auction, command: VoiceCommand): Promise<boolean> {
    // Broadcast current auction state
    this.broadcastToAuction(auction.id, {
      type: 'auction_update',
      auctionId: auction.id,
      participantId: command.participantId,
      data: {
        currentBid: auction.currentBid,
        item: auction.item,
        status: auction.status
      },
      timestamp: new Date()
    });
    return true;
  }

  // Process leave command
  private async processLeaveCommand(auction: Auction, command: VoiceCommand): Promise<boolean> {
    const participant = auction.participants.get(command.participantId);
    if (!participant) return false;

    participant.isActive = false;
    auction.participants.delete(command.participantId);

    this.broadcastToAuction(auction.id, {
      type: 'participant_left',
      auctionId: auction.id,
      participantId: command.participantId,
      data: participant,
      timestamp: new Date()
    });

    return true;
  }

  // Process end auction command
  private async processEndAuctionCommand(auction: Auction, command: VoiceCommand): Promise<boolean> {
    auction.status = 'ended';
    auction.endTime = new Date();

    this.broadcastToAuction(auction.id, {
      type: 'auction_ended',
      auctionId: auction.id,
      participantId: command.participantId,
      data: {
        finalBid: auction.currentBid,
        endTime: auction.endTime,
        totalBids: auction.bids.length
      },
      timestamp: new Date()
    });

    return true;
  }

  // Broadcast message to all participants in auction
  private broadcastToAuction(auctionId: string, message: any) {
    const auction = this.auctions.get(auctionId);
    if (!auction) return;

    // In a real implementation, this would send via WebSocket
    // For demo purposes, we'll use custom events
    window.dispatchEvent(new CustomEvent('auction_broadcast', {
      detail: { auctionId, message }
    }));
  }

  // Get auction by ID
  getAuction(auctionId: string): Auction | null {
    return this.auctions.get(auctionId) || null;
  }

  // Get auction by code
  getAuctionByCode(code: string): Auction | null {
    return Array.from(this.auctions.values())
      .find(a => a.code === code) || null;
  }

  // Get all active auctions
  getActiveAuctions(): Auction[] {
    return Array.from(this.auctions.values())
      .filter(a => a.status === 'active' || a.status === 'waiting');
  }

  // Start auction
  startAuction(auctionId: string): boolean {
    const auction = this.auctions.get(auctionId);
    if (!auction || auction.status !== 'waiting') return false;

    auction.status = 'active';
    auction.startTime = new Date();

    this.broadcastToAuction(auction.id, {
      type: 'auction_update',
      auctionId: auction.id,
      data: { status: 'active', startTime: auction.startTime },
      timestamp: new Date()
    });

    return true;
  }
}

export const auctionService = new AuctionService();