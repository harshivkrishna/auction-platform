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
import AuctioneerMicBroadcast from './AuctioneerMicBroadcast';

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
  const [lastBidResult, setLastBidResult] = useState<any>(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
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
      } else {
        setCurrentBid(null);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load auction');
      }
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    if (!token) return;
    socketRef.current = socketService.connect(token);
    socketService.joinAuction(id!);

    socketService.onAuctionState((data) => {
      setAuction(data.auction);
      setParticipants(data.auction.participants || []);
      setBids(data.auction.bids || []);
      if (data.currentBid) {
        setCurrentBid(data.currentBid);
      }
    });

    socketService.onUserJoined((data) => {
      setParticipants(prev => {
        if (prev.some(p => p.user._id === data.user._id)) return prev;
        toast.success(`${data.user.name} joined the auction`);
        return [...prev, { user: data.user, joinedAt: data.timestamp, isActive: true }];
      });
    });

    socketService.onParticipantJoined((data) => {
      setParticipants(prev => {
        if (prev.some(p => p.user._id === data.participant.user._id)) return prev;
        return [...prev, data.participant];
      });
    });

    socketService.onNewBid((data) => {
      setBids(prev => {
        if (prev.some(bid => bid.id === data.bid.id || bid._id === data.bid._id)) return prev;
        toast.success(`New bid: $${data.bid.amount.toLocaleString()}`);
        return [...prev, data.bid];
      });
      setCurrentBid(data.bid);
      setLastBidResult({ success: true, data: { bid: data.bid } });
      setIsProcessingCommand(false);
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
      setIsProcessingCommand(false);
      if (data.result.type === 'error') {
        setLastBidResult({ success: false, message: data.result.message });
        toast.error(data.result.message);
      }
    });

    socketService.onBidResult((result) => {
      setIsProcessingCommand(false);
      if (result.success && result.data.bid) {
        setLastBidResult(result);
      } else if (!result.success) {
        setLastBidResult(result);
        toast.error(result.message || 'Failed to place bid');
      }
    });
  };

  const handleVoiceCommand = (command: string, confidence: number = 0.9) => {
    if (!auction) return;
    setIsProcessingCommand(true);
    socketService.sendVoiceCommand(auction._id, command, confidence);
  };

  const handleManualBid = (amount: number) => {
    if (!auction) return;
    setIsProcessingCommand(true);
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

  // Listen for auctioneer audio and play it (for participants only)
  useEffect(() => {
    if (!user?._id === auction?.auctioneer._id) {
      let audioContext: AudioContext | null = null;
      let source: MediaSource | null = null;
      let audioQueue: Blob[] = [];
      let isPlaying = false;

      const playAudio = async (blob: Blob) => {
        if (!audioContext) {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(audioContext.destination);
        bufferSource.start();
      };

      const handleAuctioneerAudio = (data: any) => {
        if (data && data.audio) {
          playAudio(new Blob([data.audio], { type: 'audio/webm' }));
        }
      };

      socketService.onAuctioneerAudio(handleAuctioneerAudio);
      return () => {
        // No need to disconnect audio context, just remove listener
        socketService.onAuctioneerAudio(() => {});
      };
    }
  }, [user?._id, auction?.auctioneer._id]);

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
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <AuctionHeader 
        auction={auction} 
        currentBidAmount={currentBidAmount}
        onLeave={() => navigate('/dashboard')}
      />

      <div className="flex flex-1 h-[calc(100vh-80px)] overflow-hidden">
        {/* Main Content - Left Side */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Section - Current Bid Display (full width) */}
          <div className="p-4 flex-shrink-0">
            <CurrentBidDisplay 
              currentBid={currentBidAmount}
              bidderName={currentBid?.bidderName}
              bidder={currentBid?.bidder}
              itemTitle={auction.item.title}
              status={auction.status}
            />
          </div>

          {/* Participants Grid (fills remaining space) */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ParticipantGrid 
              participants={participants}
              voiceActivity={voiceActivity}
              currentUser={user}
            />
            {/* Auctioneer Mic Broadcast - only for auctioneer */}
            {isAuctioneer && (
              <div className="mt-8 flex justify-center items-center w-full">
                <AuctioneerMicBroadcast auctionId={auction._id} />
              </div>
            )}
          </div>

          {/* Voice Controls (if not auctioneer) - now directly after participants */}
          {!isAuctioneer && (
            <div className="p-4 flex-shrink-0">
              <VoiceControls 
                onVoiceCommand={handleVoiceCommand}
                onManualBid={handleManualBid}
                onVoiceActivity={handleVoiceActivity}
                currentBid={currentBidAmount}
                minIncrement={auction.minBidIncrement}
                isActive={auction.status === 'active'}
                lastBidResult={lastBidResult}
                isProcessingCommand={isProcessingCommand}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col min-h-0">
          {/* Auctioneer Controls */}
          {isAuctioneer && (
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <AuctioneerControls 
                auction={auction}
                onStart={handleStartAuction}
                onEnd={handleEndAuction}
              />
            </div>
          )}

          {/* Bid History */}
          <div className="overflow-hidden min-h-0">
            <BidHistory bids={bids} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionRoom;