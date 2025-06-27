import React, { useState, useEffect } from 'react';
import { Gavel, Users, DollarSign, Clock, Mic, MicOff, Settings, Play, Pause, Square } from 'lucide-react';
import { Auction, AuctionItem, Participant } from '../types/auction';
import { auctionService } from '../services/auctionService';
import { voiceService } from '../services/voiceService';
import LiveBidFeed from './LiveBidFeed';
import VoiceVisualization from './VoiceVisualization';
import ParticipantList from './ParticipantList';

interface AuctioneerDashboardProps {
  auctioneer: Participant;
}

const AuctioneerDashboard: React.FC<AuctioneerDashboardProps> = ({ auctioneer }) => {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Sample auction item
  const sampleItem: AuctionItem = {
    id: 'item_001',
    title: 'Vintage Rolex Submariner',
    description: 'Rare 1960s Rolex Submariner in excellent condition with original box and papers.',
    imageUrl: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800',
    startingPrice: 15000,
    reservePrice: 20000,
    category: 'Luxury Watches',
    condition: 'Excellent',
    provenance: 'Private Collection'
  };

  useEffect(() => {
    // Create auction on component mount
    const newAuction = auctionService.createAuction(auctioneer, sampleItem, 30);
    setAuction(newAuction);

    // Update time every second
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    // Listen for auction updates
    const handleAuctionBroadcast = (event: CustomEvent) => {
      if (event.detail.auctionId === newAuction.id) {
        setAuction(auctionService.getAuction(newAuction.id));
      }
    };

    window.addEventListener('auction_broadcast', handleAuctionBroadcast as EventListener);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('auction_broadcast', handleAuctionBroadcast as EventListener);
    };
  }, [auctioneer]);

  const startAuction = () => {
    if (auction) {
      auctionService.startAuction(auction.id);
    }
  };

  const toggleVoice = () => {
    if (isVoiceActive) {
      voiceService.stopListening();
      setIsVoiceActive(false);
    } else {
      voiceService.startListening(auctioneer.id, auctioneer.name, (command) => {
        if (auction) {
          auctionService.processVoiceCommand(auction.id, command);
        }
      });
      setIsVoiceActive(true);
    }
  };

  const endAuction = () => {
    if (auction) {
      const endCommand = voiceService.simulateVoiceCommand(
        auctioneer.id, 
        auctioneer.name, 
        'End Auction'
      );
      auctionService.processVoiceCommand(auction.id, endCommand);
    }
  };

  if (!auction) return <div>Loading...</div>;

  const participantCount = auction.participants.size;
  const currentBidAmount = auction.currentBid?.amount || auction.item.startingPrice;
  const timeElapsed = auction.startTime ? 
    Math.floor((currentTime.getTime() - auction.startTime.getTime()) / 1000) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-amber-500 p-3 rounded-full">
                <Gavel className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Auctioneer Dashboard</h1>
                <p className="text-gray-600">Managing: {auction.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Auction Code</p>
                <p className="text-3xl font-bold text-amber-600">{auction.code ? auction.code.slice(-6).padStart(6, '0') : '------'}</p>
              </div>
              <div className="bg-amber-50 px-4 py-2 rounded-lg">
                <p className="text-amber-800 font-semibold">
                  Status: <span className="capitalize">{auction.status}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Auction Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Display */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img 
                    src={auction.item.imageUrl} 
                    alt={auction.item.title}
                    className="w-full h-80 object-cover rounded-lg"
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
                      <span className="text-gray-500">Reserve Price:</span>
                      <span className="font-semibold">${auction.item.reservePrice?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-semibold">{auction.item.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Bid Display */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-8 text-white">
              <div className="text-center">
                <p className="text-emerald-100 text-lg mb-2">Current Highest Bid</p>
                <p className="text-5xl font-bold mb-4">${currentBidAmount.toLocaleString()}</p>
                {auction.currentBid && (
                  <p className="text-emerald-100">
                    by {auction.currentBid.bidderName} • {auction.currentBid.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Auction Controls</h3>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600">
                    {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {auction.status === 'waiting' && (
                  <button
                    onClick={startAuction}
                    className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Auction</span>
                  </button>
                )}
                
                <button
                  onClick={toggleVoice}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                    isVoiceActive 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isVoiceActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span>{isVoiceActive ? 'Stop Voice' : 'Start Voice'}</span>
                </button>
                
                {auction.status === 'active' && (
                  <button
                    onClick={endAuction}
                    className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    <span>End Auction</span>
                  </button>
                )}
              </div>
            </div>

            {/* Voice Visualization */}
            {isVoiceActive && <VoiceVisualization />}

            {/* Live Bid Feed */}
            <LiveBidFeed auction={auction} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{participantCount}</p>
                    <p className="text-gray-600">Participants</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{auction.bids.length}</p>
                    <p className="text-gray-600">Total Bids</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants List */}
            <ParticipantList participants={Array.from(auction.participants.values())} />

            {/* Live Transcription */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Live Transcription</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {auction.transcriptionLog.slice(-10).map((log) => (
                  <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-gray-900">{log.participantName}</p>
                      <span className="text-xs text-gray-500">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{log.text}</p>
                    <div className="flex items-center mt-1">
                      <div className="bg-green-100 px-2 py-1 rounded text-xs text-green-800">
                        {Math.round(log.confidence * 100)}% confidence
                      </div>
                    </div>
                  </div>
                ))}
                {auction.transcriptionLog.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No voice activity yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctioneerDashboard;