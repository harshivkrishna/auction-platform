# Voice-Based Auction Platform

A comprehensive real-time voice-driven auction platform with advanced features for both auctioneers and bidders.

## 🎯 Core Features

- **Real-time Voice Bidding**: Process voice commands like "Bid 5000", "Repeat", "Leave Auction"
- **Multi-Speaker Support**: Handle concurrent bidding with speaker diarization
- **Advanced Concurrency Control**: First-valid-bid allocation with timestamp-based ordering
- **Live Transcription Broadcasting**: Real-time voice-to-text for all participants
- **WebSocket Communication**: Instant updates and seamless real-time synchronization
- **6-Digit Auction Codes**: Easy joining mechanism for bidders
- **Production-Ready Architecture**: Scalable design supporting multiple simultaneous auctions

## 🏗️ Technical Architecture

### Core Components

1. **Auction Service** (`src/services/auctionService.ts`)
   - Manages auction lifecycle and state
   - Handles participant management
   - Processes voice commands with concurrency control
   - Maintains bid history and validation

2. **Voice Service** (`src/services/voiceService.ts`)
   - Intent classification for voice commands
   - Speaker diarization simulation
   - Real-time voice processing
   - Command extraction and validation

3. **Type Definitions** (`src/types/auction.ts`)
   - Comprehensive data structures for auctions, bids, participants
   - WebSocket message schemas
   - API response interfaces

### Data Structures

#### Auction
```typescript
interface Auction {
  id: string;
  code: string; // 6-digit join code
  title: string;
  item: AuctionItem;
  auctioneer: Participant;
  participants: Map<string, Participant>;
  bids: Bid[];
  currentBid?: Bid;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  voiceCommands: VoiceCommand[];
  transcriptionLog: TranscriptionEntry[];
  concurrencyQueue: ConcurrencyQueueItem[];
  // ... additional fields
}
```

#### Bid Processing
```typescript
interface Bid {
  id: string;
  bidderId: string;
  amount: number;
  timestamp: Date;
  confidence: number;
  transcription: string;
  status: 'pending' | 'accepted' | 'rejected' | 'superseded';
  processingOrder: number;
}
```

#### Voice Command Processing
```typescript
interface VoiceCommand {
  id: string;
  participantId: string;
  command: string;
  intent: 'bid' | 'repeat' | 'leave' | 'end_auction' | 'unknown';
  confidence: number;
  extractedValue?: number;
  status: 'processing' | 'completed' | 'failed';
}
```

## 🔄 Real-Time Event Flow

### WebSocket Events

1. **Connection Events**
   - `connection_established`: Client connected
   - `participant_joined`: New participant joins auction
   - `participant_left`: Participant leaves auction

2. **Auction Events**
   - `auction_update`: Status or configuration changes
   - `auction_ended`: Auction concluded

3. **Bidding Events**
   - `new_bid`: Valid bid accepted
   - `voice_activity`: Voice command detected
   - `transcription`: Live voice-to-text updates
   - `command_processed`: Voice command processing result

### Example Voice Bid Pipeline

```
1. Bidder speaks: "Bid 5000"
   ↓
2. Voice Service extracts intent and value
   ↓
3. Command added to concurrency queue with timestamp
   ↓
4. Queue processed in order (first-valid-bid wins)
   ↓
5. Bid validation (amount, participant eligibility)
   ↓
6. If valid: Update auction state, broadcast to all participants
   ↓
7. Real-time UI updates across all connected clients
```

## 🚀 API Design

### REST Endpoints

```typescript
// Auction Management
POST /api/auctions - Create new auction
GET /api/auctions/:id - Get auction details
PUT /api/auctions/:id/start - Start auction
PUT /api/auctions/:id/end - End auction

// Participant Management
POST /api/auctions/:id/join - Join auction with code
DELETE /api/auctions/:id/participants/:participantId - Leave auction

// Voice Commands
POST /api/auctions/:id/voice-command - Process voice command
GET /api/auctions/:id/transcription - Get transcription log

// Bidding
POST /api/auctions/:id/bids - Place bid (via voice or manual)
GET /api/auctions/:id/bids - Get bid history
```

### WebSocket Message Format

```typescript
interface WebSocketMessage {
  type: string;
  auctionId: string;
  participantId?: string;
  data: any;
  timestamp: Date;
}
```

## 🎨 User Interface

### Auctioneer Dashboard
- Real-time auction management and control
- Live participant monitoring with voice activity indicators
- Comprehensive bid feed with processing status
- Voice command visualization and transcription log
- Professional auction house aesthetics

### Bidder Interface
- Mobile-optimized voice bidding interface
- Real-time auction status and current bid display
- Voice visualization with speaking indicators
- Quick bid buttons for fast participation
- Live transcription and command feedback

## 🔧 Concurrency Handling

### Bid Processing Queue
```typescript
// Timestamp-based ordering ensures fairness
const processCommandQueue = async (auction: Auction) => {
  const unprocessedCommands = auction.concurrencyQueue
    .filter(item => !item.processed)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  // Process in strict chronological order
  for (const queueItem of unprocessedCommands) {
    queueItem.processed = true;
    await processCommand(queueItem.command);
  }
};
```

### Speaker Diarization
- Multi-speaker audio processing
- Voice activity detection
- Speaker identification and separation
- Confidence scoring for recognition accuracy

## 🛠️ Production Considerations

### Scalability Features
- Horizontal scaling support for multiple auctions
- Efficient WebSocket connection management
- Database optimization for high-frequency bid updates
- CDN integration for global accessibility

### Security & Reliability
- Input validation and sanitization
- Rate limiting for voice commands
- Auction state persistence and recovery
- Comprehensive error handling and logging

### Performance Optimization
- Real-time audio processing optimization
- Efficient state synchronization
- Minimal latency WebSocket communication
- Responsive UI with optimistic updates

## 🚦 Getting Started

1. **Installation**
   ```bash
   npm install
   ```

2. **Development**
   ```bash
   npm run dev
   ```

3. **Usage**
   - Visit the application
   - Choose "Start an Auction" (Auctioneer) or "Join an Auction" (Bidder)
   - For auctioneers: Create auction and share the 6-digit code
   - For bidders: Enter the 6-digit code to join
   - Use voice commands or interface controls to participate

## 📋 Voice Commands

### Bidder Commands
- `"Bid [amount]"` - Place a bid (e.g., "Bid 5000")
- `"Repeat"` - Request current auction status
- `"Leave Auction"` - Exit the auction

### Auctioneer Commands
- `"End Auction"` - Conclude the auction
- Standard bidding commands (auctioneers can also bid)

## 🔮 Future Enhancements

- Integration with actual speech recognition services (Google Cloud Speech-to-Text, Azure Cognitive Services)
- Advanced audio processing for noise reduction
- Multi-language support for global auctions
- Integration with payment processing systems
- Advanced analytics and reporting features
- Mobile application development
- AI-powered bid prediction and market analysis

---

This platform demonstrates a complete real-time voice-based auction system with production-ready architecture, advanced concurrency handling, and comprehensive user experience design.