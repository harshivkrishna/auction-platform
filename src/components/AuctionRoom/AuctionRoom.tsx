import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '../../services/socketService';
import api from '../../services/api';
import toast from 'react-hot-toast';

import AuctionHeader from './AuctionHeader';
import ParticipantGrid from './ParticipantGrid';
import CurrentBidDisplay from './CurrentBidDisplay';
import VoiceControls from './VoiceControls';
import BidHistory from './BidHistory';
import AuctioneerControls from './AuctioneerControls';

interface Auction {
  _id: string;
  code: string;
  title: string;
  item: any;
  status: string;
  participants: any[];
  bids: any[];
  auctioneer: any;
  startTime?: string;
  endTime?: string;
  minBidIncrement: number;
}

const AuctionRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentBid, setCurrentBid] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [voiceActivity, setVoiceActivity] = useState<Map<string, boolean>>(new Map());
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!id || !token) return;

    fetchAuction();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketService.offAllListeners();
        socketService.disconnect();
      }
    };
  }, [id, token]);

  const fetchAuction = async () => {
    try {
      const response = await api.get(`/auctions/${id}`);
      const auctionData = response.data.data.auction;
      setAuction(auctionData);
      setParticipants(auctionData.participants || []);
      setBids(auctionData.bids || []);
      
      if (auctionData.bids && auctionData.bids.length > 0) {
        const latestBid = auctionData.bids[auctionData.bids.length - 1];
        setCurrentBid(latestBid);
      }
    } catch (error: any) {
      toast.error('Failed to load auction');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    if (!token) return;

    socketRef.current = socketService.connect(token);
    
    // Join the auction room
    socketService.joinAuction(id!);

    // Set up event listeners
    socketService.onAuctionState((data) => {
      setAuction(data.auction);
      setParticipants(data.auction.participants || []);
      setBids(data.auction.bids || []);
      if (data.currentBid) {
        setCurrentBid(data.currentBid);
      }
    });

    socketService.onNewBid((data) => {
      setBids(prev => [...prev, data.bid]);
      setCurrentBid(data.bid);
      toast.success(`New bid: $${data.bid.amount.toLocaleString()}`);
    });

    socketService.onUserJoined((data) => {
      setParticipants(prev => [...prev, { user: data.user, joinedAt: data.timestamp, isActive: true }]);
      toast.success(`${data.user.name} joined the auction`);
    });

    socketService.onUserLeft((data) => {
      setParticipants(prev => prev.filter(p => p.user._id !== data.user._id));
      toast(`${data.user.name} left the auction`);
    });

    socketService.onVoiceActivity((data) => {
      setVoiceActivity(prev => new Map(prev.set(data.userId, data.isActive)));
    });

    socketService.onAuctionStarted((data) => {
      setAuction(prev => prev ? { ...prev, status: 'active', startTime: data.startTime } : null);
      toast.success('Auction has started!');
    });

    socketService.onAuctionEnded((data) => {
      setAuction(prev => prev ? { ...prev, status: 'ended', endTime: data.endTime } : null);
      toast('Auction has ended');
    });

    socketService.onVoiceCommandProcessed((data) => {
      if (data.result.type === 'error') {
        toast.error(data.result.message);
      }
    });
  };

  const handleVoiceCommand = (command: string, confidence: number = 0.9) => {
    if (!auction) return;
    socketService.sendVoiceCommand(auction._id, command, confidence);
  };

  const handleManualBid = (amount: number) => {
    if (!auction) return;
    socketService.sendManualBid(auction._id, amount);
  };

  const handleVoiceActivity = (isActive: boolean) => {
    if (!auction) return;
    socketService.sendVoiceActivity(auction._id, isActive);
  };

  const handleStartAuction = async () => {
    try {
      await api.patch(`/auctions/${id}/start`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start auction');
    }
  };

  const handleEndAuction = async () => {
    try {
      await api.patch(`/auctions/${id}/end`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to end auction');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Auction not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isAuctioneer = user?._id === auction.auctioneer._id;
  const currentBidAmount = currentBid?.amount || auction.item.startingPrice;

  return (
    <div className="h-fit bg-gray-900 text-white">
      {/* Header */}
      <AuctionHeader 
        auction={auction} 
        onLeave={() => navigate('/dashboard')}
      />

      <div className="flex flex-1 h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Section - Participants Grid */}
          <div className="h-1/3 p-4">
            <ParticipantGrid 
              participants={participants}
              voiceActivity={voiceActivity}
              currentUser={user}
            />
          </div>

          {/* Middle Section - Current Bid Display */}
          <div className="h-1/3 flex items-center justify-center p-4">
            <CurrentBidDisplay 
              currentBid={currentBidAmount}
              bidderName={currentBid?.bidderName}
              bidder={currentBid?.bidder}
              itemTitle={auction.item.title}
              status={auction.status}
            />
          </div>

          {/* Bottom Section - Voice Controls */}
          <div className="h-1/3 p-4">
            {!isAuctioneer && (
              <VoiceControls 
                onVoiceCommand={handleVoiceCommand}
                onManualBid={handleManualBid}
                onVoiceActivity={handleVoiceActivity}
                currentBid={currentBidAmount}
                minIncrement={auction.minBidIncrement}
                isActive={auction.status === 'active'}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Auctioneer Controls */}
          {isAuctioneer && (
            <div className="p-4 border-b border-gray-700">
              <AuctioneerControls 
                auction={auction}
                onStart={handleStartAuction}
                onEnd={handleEndAuction}
              />
            </div>
          )}

          {/* Bid History */}
          <div className="flex-1 overflow-hidden">
            <BidHistory bids={bids} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionRoom;