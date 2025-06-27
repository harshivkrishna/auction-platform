import express from 'express';
import { body, validationResult } from 'express-validator';
import Auction from '../models/Auction.js';
import User from '../models/User.js';
import { requireRole } from '../middleware/auth.js';
import { io } from '../index.js';

const router = express.Router();

// Create auction (auctioneer only)
router.post('/', requireRole(['auctioneer']), [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('item.title').trim().isLength({ min: 3, max: 100 }).withMessage('Item title must be 3-100 characters'),
  body('item.description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('item.startingPrice').isFloat({ min: 1 }).withMessage('Starting price must be at least $1'),
  body('item.category').trim().notEmpty().withMessage('Category is required'),
  body('duration').optional().isInt({ min: 1, max: 180 }).withMessage('Duration must be 1-180 minutes')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const auctionData = {
      ...req.body,
      auctioneer: req.user._id
    };

    const auction = new Auction(auctionData);
    await auction.save();

    // Populate auctioneer data
    await auction.populate('auctioneer', 'name email role avatar');

    // Add to user's created auctions
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdAuctions: auction._id }
    });

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: { auction }
    });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create auction',
      error: error.message
    });
  }
});

// Get user's auctions
router.get('/my-auctions', async (req, res) => {
  try {
    let auctions;
    
    if (req.user.role === 'auctioneer') {
      auctions = await Auction.find({ auctioneer: req.user._id })
        .populate('auctioneer', 'name email role avatar')
        .populate('participants.user', 'name email role avatar')
        .sort({ createdAt: -1 });
    } else {
      auctions = await Auction.find({ 
        'participants.user': req.user._id 
      })
        .populate('auctioneer', 'name email role avatar')
        .populate('participants.user', 'name email role avatar')
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: { auctions }
    });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auctions',
      error: error.message
    });
  }
});

// Join auction with code
router.post('/join/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const auction = await Auction.findOne({ code })
      .populate('auctioneer', 'name email role avatar')
      .populate('participants.user', 'name email role avatar');

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found with this code'
      });
    }

    if (auction.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'This auction has already ended'
      });
    }

    // Check if user is already a participant
    const existingParticipant = auction.participants.find(
      p => p.user._id.toString() === req.user._id.toString()
    );

    if (existingParticipant) {
      return res.json({
        success: true,
        message: 'Already joined this auction',
        data: { auction }
      });
    }

    // Add user as participant
    auction.participants.push({
      user: req.user._id,
      joinedAt: new Date(),
      isActive: true,
      voiceActive: false,
      lastActivity: new Date()
    });

    await auction.save();

    // Add to user's participated auctions
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { participatedAuctions: auction._id }
    });

    // Populate the new participant
    await auction.populate('participants.user', 'name email role avatar');

    // Broadcast participant joined
    io.to(`auction_${auction._id}`).emit('participant_joined', {
      auctionId: auction._id,
      participant: {
        user: req.user,
        joinedAt: new Date(),
        isActive: true,
        voiceActive: false
      }
    });

    res.json({
      success: true,
      message: 'Successfully joined auction',
      data: { auction }
    });
  } catch (error) {
    console.error('Join auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join auction',
      error: error.message
    });
  }
});

// Get auction by ID
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('auctioneer', 'name email role avatar')
      .populate('participants.user', 'name email role avatar')
      .populate('bids.bidder', 'name email role avatar')
      .populate('transcriptionLog.participant', 'name email role avatar');

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Check if user has access to this auction
    const hasAccess = auction.auctioneer._id.toString() === req.user._id.toString() ||
                     auction.participants.some(p => p.user._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this auction'
      });
    }

    res.json({
      success: true,
      data: { auction }
    });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auction',
      error: error.message
    });
  }
});

// Start auction (auctioneer only)
router.patch('/:id/start', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    if (auction.auctioneer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the auctioneer can start this auction'
      });
    }

    if (auction.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        message: 'Auction cannot be started in current state'
      });
    }

    auction.status = 'active';
    auction.startTime = new Date();
    await auction.save();

    // Broadcast auction started
    io.to(`auction_${auction._id}`).emit('auction_started', {
      auctionId: auction._id,
      startTime: auction.startTime
    });

    res.json({
      success: true,
      message: 'Auction started successfully',
      data: { auction }
    });
  } catch (error) {
    console.error('Start auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start auction',
      error: error.message
    });
  }
});

// End auction (auctioneer only)
router.patch('/:id/end', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('bids.bidder', 'name email role avatar');

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    if (auction.auctioneer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the auctioneer can end this auction'
      });
    }

    auction.status = 'ended';
    auction.endTime = new Date();
    await auction.save();

    // Broadcast auction ended
    io.to(`auction_${auction._id}`).emit('auction_ended', {
      auctionId: auction._id,
      endTime: auction.endTime,
      finalBid: auction.bids.length > 0 ? auction.bids[auction.bids.length - 1] : null
    });

    res.json({
      success: true,
      message: 'Auction ended successfully',
      data: { auction }
    });
  } catch (error) {
    console.error('End auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end auction',
      error: error.message
    });
  }
});

export default router;