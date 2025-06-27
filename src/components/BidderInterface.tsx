import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Users, DollarSign, Clock, Volume2, LogOut } from 'lucide-react';
import { Auction, Participant } from '../types/auction';
import { auctionService } from '../services/auctionService';
import { voiceService } from '../services/voiceService';
import { socketService } from '../services/socketService';
import VoiceVisualization from './VoiceVisualization';
import toast from 'react-hot-toast';

interface BidderInterfaceProps {
  bidder: Participant;
  auctionCode: string;
}

const BidderInterface: React.FC<BidderInterfaceProps> = ({ bidder, auctionCode }) => {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastCommand, setLastCommand] = useState<string>('');

  console.log('[BidderInterface] Component rendered');

  useEffect(() => {
    // Join auction
    const joinedAuction = auctionService.getAuctionByCode(auctionCode);
    if (joinedAuction) {
      const updatedAuction = auctionService.joinAuction(auctionCode, bidder);
      setAuction(updatedAuction);
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }

    // Update time every second
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    // Listen for auction updates
    const handleAuctionBroadcast = (event: CustomEvent) => {
      if (auction && event.detail.auctionId === auction.id) {
        setAuction(auctionService.getAuction(auction.id));
      }
    };

    window.addEventListener('auction_broadcast', handleAuctionBroadcast as EventListener);

    // Listen for voice command results from backend
    socketService.onVoiceCommandProcessed((data) => {
      if (data.result.type === 'error') {
        toast.error(data.result.message);
      }
      if (data.result.warning) {
        toast.error(data.result.warning);
      }
    });

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('auction_broadcast', handleAuctionBroadcast as EventListener);
    };
  }, [auctionCode, bidder, auction?.id]);

  const toggleVoice = () => {
    alert('Mic button clicked!');
    if (isVoiceActive) {
      console.log('[BidderInterface] Stopping voiceService');
      voiceService.stopListening();
      setIsVoiceActive(false);
    } else {
      console.log('[BidderInterface] Calling voiceService.startListening');
      voiceService.startListening(bidder.id, bidder.name, (command) => {
        console.log('[BidderInterface] Received command from voiceService:', command);
        if (auction) {
          socketService.sendVoiceCommand(auction.id, command.command, command.confidence);
          setLastCommand(command.command);
        }
      });
      setIsVoiceActive(true);
    }
  };

  const simulateVoiceCommand = (commandText: string) => {
    if (auction) {
      const command = voiceService.simulateVoiceCommand(bidder.id, bidder.name, commandText);
      // Send simulated voice command to backend via socket
      socketService.sendVoiceCommand(auction.id, command.command, command.confidence);
      setLastCommand(commandText);
    }
  };

  const leaveAuction = () => {
    simulateVoiceCommand('Leave Auction');
  };

  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Auction Not Found</h2>
          <p className="text-gray-600 mb-6">Could not find an auction with code: {auctionCode}</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to auction...</p>
        </div>
      </div>
    );
  }

  const currentBidAmount = auction.currentBid?.amount || auction.item.startingPrice;
  const nextMinimumBid = currentBidAmount + auction.minBidIncrement;
  const timeElapsed = auction.startTime ? 
    Math.floor((currentTime.getTime() - auction.startTime.getTime()) / 1000) : 0;
  const isMyBid = auction.currentBid?.bidderId === bidder.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-500">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Auction</h1>
              <p className="text-gray-600">{auction.title}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Code</p>
                <p className="text-xl font-bold text-blue-600">{auction.code}</p>
              </div>
              <button
                onClick={leaveAuction}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${auction.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="font-semibold capitalize">{auction.status}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-500" />
                <span>{auction.participants.size} participants</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Item Display */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img 
                src={auction.item.imageUrl} 
                alt={auction.item.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{auction.item.title}</h2>
              <p className="text-gray-600 mb-4">{auction.item.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Starting Price:</span>
                  <span className="font-semibold">${auction.item.startingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Minimum Increment:</span>
                  <span className="font-semibold">${auction.minBidIncrement.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Bid */}
        <div className={`rounded-xl shadow-lg p-8 text-white ${
          isMyBid ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
        }`}>
          <div className="text-center">
            <p className="text-white/80 text-lg mb-2">
              {isMyBid ? 'Your Current Bid' : 'Current Highest Bid'}
            </p>
            <p className="text-4xl font-bold mb-2">${currentBidAmount.toLocaleString()}</p>
            {auction.currentBid && (
              <p className="text-white/80">
                by {auction.currentBid.bidderName} • {auction.currentBid.timestamp.toLocaleTimeString()}
              </p>
            )}
            <div className="mt-4 p-4 bg-white/10 rounded-lg">
              <p className="text-white/80 text-sm">Next minimum bid</p>
              <p className="text-2xl font-bold">${nextMinimumBid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Voice Bidding</h3>
            <p className="text-gray-600">Say "Bid [amount]", "Repeat", or "Leave Auction"</p>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={toggleVoice}
              className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-xl transition-all duration-300 ${
                isVoiceActive 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50' 
                  : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
              }`}
            >
              {isVoiceActive ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          {isVoiceActive && <VoiceVisualization />}

          {lastCommand && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">
                <strong>Last Command:</strong> "{lastCommand}"
              </p>
            </div>
          )}
        </div>

        {/* Quick Bid Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Bid</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[nextMinimumBid, nextMinimumBid + 500, nextMinimumBid + 1000, nextMinimumBid + 2000].map((amount) => (
              <button
                key={amount}
                onClick={() => simulateVoiceCommand(`Bid ${amount}`)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                disabled={auction.status !== 'active'}
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Bids */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Bids</h3>
          <div className="space-y-3">
            {auction.bids.slice(-5).reverse().map((bid) => (
              <div key={bid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{bid.bidderName}</p>
                  <p className="text-sm text-gray-500">{bid.timestamp.toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">${bid.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{Math.round(bid.confidence * 100)}% confidence</p>
                </div>
              </div>
            ))}
            {auction.bids.length === 0 && (
              <p className="text-gray-500 text-center py-8">No bids yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidderInterface;