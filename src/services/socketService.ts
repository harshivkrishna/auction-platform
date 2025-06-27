import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    
    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  joinAuction(auctionId: string) {
    if (this.socket) {
      this.socket.emit('join_auction', auctionId);
    }
  }

  sendVoiceCommand(auctionId: string, command: string, confidence: number = 0.9) {
    if (this.socket) {
      this.socket.emit('voice_command', {
        auctionId,
        command,
        confidence
      });
    }
  }

  sendVoiceActivity(auctionId: string, isActive: boolean) {
    if (this.socket) {
      this.socket.emit('voice_activity', {
        auctionId,
        isActive
      });
    }
  }

  sendManualBid(auctionId: string, amount: number) {
    if (this.socket) {
      this.socket.emit('manual_bid', {
        auctionId,
        amount
      });
    }
  }

  onAuctionState(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('auction_state', callback);
    }
  }

  onNewBid(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('new_bid', callback);
    }
  }

  onParticipantJoined(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('participant_joined', callback);
    }
  }

  onParticipantLeft(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('participant_left', callback);
    }
  }

  onUserJoined(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_joined', callback);
    }
  }

  onUserLeft(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('user_left', callback);
    }
  }

  onVoiceActivity(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('participant_voice_activity', callback);
    }
  }

  onVoiceCommandProcessed(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('voice_command_processed', callback);
    }
  }

  onAuctionStarted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('auction_started', callback);
    }
  }

  onAuctionEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('auction_ended', callback);
    }
  }

  offAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();