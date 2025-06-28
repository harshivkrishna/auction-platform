import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Auction from '../models/Auction.js';
import { processVoiceCommand } from '../services/voiceService.js';

export const setupSocketHandlers = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      if (!process.env.JWT_SECRET) {
        return next(new Error('Server configuration error: JWT_SECRET not set'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected`);

    // Join auction room
    socket.on('join_auction', async (auctionId) => {
      try {
        const auction = await Auction.findById(auctionId)
          .populate('auctioneer', 'name email role avatar')
          .populate('participants.user', 'name email role avatar');

        if (!auction) {
          socket.emit('error', { message: 'Auction not found' });
          return;
        }

        // Check if user has access
        const hasAccess = auction.auctioneer._id.toString() === socket.userId ||
                         auction.participants.some(p => p.user._id.toString() === socket.userId);

        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this auction' });
          return;
        }

        socket.join(`auction_${auctionId}`);
        socket.currentAuction = auctionId;
        console.log(`[Socket] User ${socket.userId} joined room auction_${auctionId}`);

        // Update participant status
        if (auction.auctioneer._id.toString() !== socket.userId) {
          const participantIndex = auction.participants.findIndex(
            p => p.user._id.toString() === socket.userId
          );
          
          if (participantIndex !== -1) {
            auction.participants[participantIndex].isActive = true;
            auction.participants[participantIndex].lastActivity = new Date();
            await auction.save();
          }
        }

        // Send current auction state
        socket.emit('auction_state', {
          auction,
          participants: auction.participants.length,
          currentBid: auction.bids.length > 0 ? auction.bids[auction.bids.length - 1] : null
        });

        // Notify others of user joining
        socket.to(`auction_${auctionId}`).emit('user_joined', {
          user: socket.user,
          timestamp: new Date()
        });

        // Also emit participant_joined for consistency
        socket.to(`auction_${auctionId}`).emit('participant_joined', {
          auctionId,
          participant: {
            user: socket.user,
            joinedAt: new Date(),
            isActive: true,
            voiceActive: false
          }
        });

      } catch (error) {
        console.error('Join auction error:', error);
        socket.emit('error', { message: 'Failed to join auction' });
      }
    });

    // Handle voice command
    socket.on('voice_command', async (data) => {
      try {
        const { auctionId, command, confidence = 0.9 } = data;
        
        if (!socket.currentAuction || socket.currentAuction !== auctionId) {
          socket.emit('error', { message: 'Not joined to this auction' });
          return;
        }

        const result = await processVoiceCommand(auctionId, {
          participantId: socket.userId,
          participantName: socket.user.name,
          command,
          confidence,
          timestamp: new Date()
        });

        if (result.success) {
          // Broadcast to all participants in the auction
          io.to(`auction_${auctionId}`).emit('voice_command_processed', {
            auctionId,
            participant: socket.user,
            command,
            result: result.data,
            timestamp: new Date()
          });

          // If it's a bid, broadcast the new bid
          if (result.data.type === 'bid' && result.data.bid) {
            console.log('[Socket] Emitting new_bid for auction', auctionId, result.data.bid);
            io.to(`auction_${auctionId}`).emit('new_bid', {
              auctionId,
              bid: result.data.bid,
              timestamp: new Date()
            });
          }
        } else {
          // Send error result to the user
          socket.emit('voice_command_processed', {
            auctionId,
            participant: socket.user,
            command,
            result: result,
            timestamp: new Date()
          });
        }

      } catch (error) {
        console.error('Voice command error:', error);
        socket.emit('error', { message: 'Failed to process voice command' });
      }
    });

    // Handle voice activity (for real-time indicators)
    socket.on('voice_activity', (data) => {
      const { auctionId, isActive } = data;
      
      if (socket.currentAuction === auctionId) {
        socket.to(`auction_${auctionId}`).emit('participant_voice_activity', {
          userId: socket.userId,
          userName: socket.user.name,
          isActive,
          timestamp: new Date()
        });
      }
    });

    // Handle manual bid (fallback)
    socket.on('manual_bid', async (data) => {
      try {
        const { auctionId, amount } = data;
        
        const result = await processVoiceCommand(auctionId, {
          participantId: socket.userId,
          participantName: socket.user.name,
          command: `Bid ${amount}`,
          confidence: 1.0,
          timestamp: new Date(),
          isManual: true
        });

        if (result.success && result.data.bid) {
          console.log('[Socket] Emitting new_bid for auction', auctionId, result.data.bid);
          io.to(`auction_${auctionId}`).emit('new_bid', {
            auctionId,
            bid: result.data.bid,
            timestamp: new Date()
          });
        }

        socket.emit('bid_result', result);

      } catch (error) {
        console.error('Manual bid error:', error);
        socket.emit('error', { message: 'Failed to place bid' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.name} disconnected`);
      
      if (socket.currentAuction) {
        try {
          // Update participant status
          const auction = await Auction.findById(socket.currentAuction);
          if (auction && auction.auctioneer._id.toString() !== socket.userId) {
            const participantIndex = auction.participants.findIndex(
              p => p.user._id.toString() === socket.userId
            );
            
            if (participantIndex !== -1) {
              auction.participants[participantIndex].isActive = false;
              auction.participants[participantIndex].lastActivity = new Date();
              await auction.save();
            }
          }

          // Notify others of user leaving
          socket.to(`auction_${socket.currentAuction}`).emit('user_left', {
            user: socket.user,
            timestamp: new Date()
          });
        } catch (error) {
          console.error('Disconnect cleanup error:', error);
        }
      }
    });

    // Handle auctioneer audio chunk
    socket.on('auctioneer_audio_chunk', (data) => {
      const { auctionId, audio } = data;
      // Broadcast to all participants except the auctioneer
      socket.to(`auction_${auctionId}`).emit('auctioneer_audio', {
        auctionId,
        audio,
        from: socket.userId
      });
    });
  });
};