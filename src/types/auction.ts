export interface Participant {
  id: string;
  name: string;
  role: 'auctioneer' | 'bidder';
  avatar: string;
  joinedAt: Date;
  isActive: boolean;
  voiceActive: boolean;
  lastActivity: Date;
}

export interface Bid {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: Date;
  confidence: number;
  transcription: string;
  voiceCommand: string;
  status: 'pending' | 'accepted' | 'rejected' | 'superseded';
  processingOrder: number;
}

export interface VoiceCommand {
  id: string;
  participantId: string;
  participantName: string;
  command: string;
  intent: 'bid' | 'repeat' | 'leave' | 'end_auction' | 'unknown';
  confidence: number;
  timestamp: Date;
  transcription: string;
  extractedValue?: number;
  status: 'processing' | 'completed' | 'failed';
}

export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startingPrice: number;
  reservePrice?: number;
  category: string;
  condition: string;
  provenance: string;
}

export interface Auction {
  id: string;
  code: string;
  title: string;
  item: AuctionItem;
  auctioneer: Participant;
  participants: Map<string, Participant>;
  bids: Bid[];
  currentBid?: Bid;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  startTime?: Date;
  endTime?: Date;
  duration: number; // in minutes
  minBidIncrement: number;
  voiceCommands: VoiceCommand[];
  transcriptionLog: Array<{
    id: string;
    participantId: string;
    participantName: string;
    text: string;
    timestamp: Date;
    confidence: number;
  }>;
  concurrencyQueue: Array<{
    id: string;
    timestamp: Date;
    command: VoiceCommand;
    processed: boolean;
  }>;
}

export interface WebSocketMessage {
  type: 'auction_update' | 'new_bid' | 'participant_joined' | 'participant_left' | 
        'voice_activity' | 'transcription' | 'command_processed' | 'auction_ended' |
        'error' | 'connection_established';
  auctionId: string;
  participantId?: string;
  data: any;
  timestamp: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}