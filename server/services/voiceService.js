import Auction from '../models/Auction.js';
import { wordsToNumbers } from 'words-to-numbers';

// Extract intent and value from voice command
const extractCommandIntent = (text) => {
  const lowercaseText = text.toLowerCase().trim();
  // Convert words to numbers (e.g., "five thousand" -> "5000")
  const normalizedText = wordsToNumbers(lowercaseText);
  
  // Bid patterns
  const bidPatterns = [
    /\$?\s*(\d+)[\.,]?/i,
    /bid\s+(\d+)/i,
    /(\d+)\s*dollars?/i,
    /i\s+bid\s+(\d+)/i,
    /bidding\s+(\d+)/i,
    /my\s+bid\s+is\s+(\d+)/i,
    /(?:place|make)\s*a\s*bid\s*(?:for)?\s*(\d+)/i,
    /(?:i\s*want\s*to\s*bid|i\s*would\s*like\s*to\s*bid)\s*(\d+)/i,
    /(?:offer|offering)\s*(\d+)/i,
    /(?:put|set)\s*(?:a\s*)?bid\s*(?:for)?\s*(\d+)/i
  ];

  for (const pattern of bidPatterns) {
    const match = normalizedText && normalizedText.toString().match(pattern);
    if (match) {
      return { intent: 'bid', value: parseInt(match[1]) };
    }
  }

  // Other command patterns
  if (lowercaseText.includes('repeat') || lowercaseText.includes('what') || lowercaseText.includes('current')) {
    return { intent: 'repeat' };
  }
  
  if (lowercaseText.includes('leave') || lowercaseText.includes('exit') || lowercaseText.includes('quit')) {
    return { intent: 'leave' };
  }
  
  if (lowercaseText.includes('end auction') || lowercaseText.includes('close auction')) {
    return { intent: 'end_auction' };
  }

  return { intent: 'unknown' };
};

// Process voice command with concurrency handling
export const processVoiceCommand = async (auctionId, commandData) => {
  try {
    let auction = await Auction.findById(auctionId)
      .populate('auctioneer', 'name email role avatar')
      .populate('participants.user', 'name email role avatar')
      .populate('bids.bidder', 'name email role avatar');

    if (!auction) {
      return { success: false, message: 'Auction not found' };
    }

    if (auction.status !== 'active') {
      return { success: false, message: 'Auction is not active' };
    }

    const { participantId, participantName, command, confidence, timestamp, isManual = false } = commandData;
    
    // Extract intent and value
    const { intent, value } = extractCommandIntent(command);

    // Add to transcription log using $push
    await Auction.findByIdAndUpdate(
      auctionId,
      {
        $push: {
          transcriptionLog: {
            participant: participantId,
            text: command,
            timestamp: timestamp || new Date(),
            confidence
          }
        }
      }
    );

    let result = { type: intent };

    switch (intent) {
      case 'bid':
        result = await processBidCommand(auctionId, auction, {
          participantId,
          participantName,
          amount: value,
          command,
          confidence,
          timestamp: timestamp || new Date(),
          isManual
        });
        break;
        
      case 'repeat':
        result = await processRepeatCommand(auction, participantId);
        break;
        
      case 'leave':
        result = await processLeaveCommand(auction, participantId);
        break;
        
      case 'end_auction':
        if (auction.auctioneer._id.toString() === participantId) {
          result = await processEndAuctionCommand(auction);
        } else {
          result = { type: 'error', message: 'Only auctioneer can end auction' };
        }
        break;
        
      default:
        result = { type: 'unknown', message: 'Command not recognized' };
    }

    // Reload auction to get latest state
    auction = await Auction.findById(auctionId);

    return { success: true, data: result };

  } catch (error) {
    console.error('Voice command processing error:', error);
    return { success: false, message: 'Failed to process command', error: error.message };
  }
};

// Process bid command with $push for concurrency safety
const processBidCommand = async (auctionId, auction, bidData) => {
  const { participantId, participantName, amount, command, confidence, timestamp, isManual } = bidData;

  if (!amount || amount <= 0) {
    return { type: 'error', message: 'Invalid bid amount' };
  }

  // Get current highest bid
  const currentHighest = auction.bids.length > 0 
    ? Math.max(...auction.bids.map(b => b.amount))
    : auction.item.startingPrice;

  const minimumBid = currentHighest + auction.minBidIncrement;

  // Validate bid amount
  if (amount < minimumBid) {
    return { 
      type: 'error', 
      message: `Bid must be at least $${minimumBid.toLocaleString()}`,
      minimumBid
    };
  }

  // Check if participant exists
  const participant = auction.participants.find(p => p.user._id.toString() === participantId);
  if (!participant && auction.auctioneer._id.toString() !== participantId) {
    return { type: 'error', message: 'Not a participant in this auction' };
  }

  // Mark previous bids as superseded (update all accepted bids to superseded)
  await Auction.updateMany(
    { _id: auctionId, 'bids.status': 'accepted' },
    { $set: { 'bids.$[elem].status': 'superseded' } },
    { arrayFilters: [{ 'elem.status': 'accepted' }] }
  );

  // Create new bid with all required fields
  const newBid = {
    bidder: participantId,
    bidderName: participantName,
    amount,
    timestamp: timestamp || new Date(),
    confidence,
    transcription: command,
    voiceCommand: command,
    status: 'accepted',
    processingOrder: auction.bids.length
  };

  // Add new bid using $push
  await Auction.findByIdAndUpdate(
    auctionId,
    { $push: { bids: newBid } }
  );

  // Fetch the latest bid (with _id) from the DB and populate bidder
  const updatedAuction = await Auction.findById(auctionId).populate('bids.bidder', 'name email role avatar');
  const latestBid = updatedAuction.bids[updatedAuction.bids.length - 1];
  // Map _id to id and include both fields for frontend compatibility
  const bidWithId = {
    ...latestBid.toObject(),
    id: latestBid._id.toString(),
    _id: latestBid._id.toString(),
    bidder: latestBid.bidder // This will now be a populated user object
  };

  return {
    type: 'bid',
    message: `Bid of $${amount.toLocaleString()} accepted`,
    bid: bidWithId,
    newHighest: amount
  };
};

// Process repeat command
const processRepeatCommand = async (auction, participantId) => {
  const currentBid = auction.bids.length > 0 
    ? auction.bids[auction.bids.length - 1]
    : null;

  const currentAmount = currentBid ? currentBid.amount : auction.item.startingPrice;
  const nextMinimum = currentAmount + auction.minBidIncrement;

  return {
    type: 'repeat',
    message: `Current bid is $${currentAmount.toLocaleString()}. Next minimum bid is $${nextMinimum.toLocaleString()}`,
    currentBid: currentAmount,
    nextMinimum,
    itemTitle: auction.item.title
  };
};

// Process leave command
const processLeaveCommand = async (auction, participantId) => {
  const participantIndex = auction.participants.findIndex(
    p => p.user._id.toString() === participantId
  );

  if (participantIndex !== -1) {
    auction.participants[participantIndex].isActive = false;
    auction.participants[participantIndex].lastActivity = new Date();
  }

  return {
    type: 'leave',
    message: 'You have left the auction'
  };
};

// Process end auction command
const processEndAuctionCommand = async (auction) => {
  auction.status = 'ended';
  auction.endTime = new Date();

  const finalBid = auction.bids.length > 0 
    ? auction.bids[auction.bids.length - 1]
    : null;

  return {
    type: 'end_auction',
    message: 'Auction has been ended',
    finalBid,
    endTime: auction.endTime
  };
};