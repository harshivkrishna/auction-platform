import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Bid amount must be positive']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  confidence: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1
  },
  transcription: {
    type: String,
    default: ''
  },
  voiceCommand: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'superseded'],
    default: 'pending'
  },
  processingOrder: {
    type: Number,
    default: 0
  }
});

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  voiceActive: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

const auctionItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Item title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Item description is required']
  },
  imageUrl: {
    type: String,
    default: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  startingPrice: {
    type: Number,
    required: [true, 'Starting price is required'],
    min: [0, 'Starting price must be positive']
  },
  reservePrice: {
    type: Number,
    min: [0, 'Reserve price must be positive']
  },
  category: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    default: 'Good'
  },
  provenance: {
    type: String,
    default: 'Private Collection'
  }
});

const transcriptionSchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  confidence: {
    type: Number,
    default: 1.0
  }
});

const auctionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: false,
    unique: true,
    length: 6
  },
  title: {
    type: String,
    required: [true, 'Auction title is required'],
    trim: true
  },
  item: {
    type: auctionItemSchema,
    required: true
  },
  auctioneer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [participantSchema],
  bids: [bidSchema],
  currentBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'ended'],
    default: 'waiting'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: [1, 'Duration must be at least 1 minute']
  },
  minBidIncrement: {
    type: Number,
    required: true,
    min: [1, 'Minimum bid increment must be at least 1']
  },
  transcriptionLog: [transcriptionSchema],
  settings: {
    allowVoiceBidding: {
      type: Boolean,
      default: true
    },
    autoEndOnInactivity: {
      type: Boolean,
      default: true
    },
    inactivityTimeout: {
      type: Number,
      default: 300 // 5 minutes in seconds
    }
  }
}, {
  timestamps: true
});

// Pre-save hook to generate a unique 6-digit code if not present
auctionSchema.pre('save', async function(next) {
  if (!this.code) {
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existingAuction = await mongoose.model('Auction').findOne({ code });
      if (!existingAuction) {
        isUnique = true;
      }
    }
    this.code = code;
  }
  // Defensive: Ensure minBidIncrement is set
  if (!this.minBidIncrement) {
    if (this.item && typeof this.item.startingPrice === 'number' && !isNaN(this.item.startingPrice)) {
      this.minBidIncrement = Math.max(this.item.startingPrice * 0.05, 50);
    } else {
      this.minBidIncrement = 50;
    }
  }
  next();
});

// Index for faster queries
auctionSchema.index({ code: 1 });
auctionSchema.index({ status: 1 });
auctionSchema.index({ auctioneer: 1 });

export default mongoose.model('Auction', auctionSchema);