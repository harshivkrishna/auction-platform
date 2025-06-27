import React, { useState } from 'react';
import { Gavel, Users, Mic, ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import { Participant } from '../types/auction';

interface AuctionHomeProps {
  onRoleSelect: (role: 'auctioneer' | 'bidder', data: any) => void;
}

const AuctionHome: React.FC<AuctionHomeProps> = ({ onRoleSelect }) => {
  const [auctioneerName, setAuctioneerName] = useState('');
  const [bidderName, setBidderName] = useState('');
  const [auctionCode, setAuctionCode] = useState('');
  const [showBidderForm, setShowBidderForm] = useState(false);

  const createAuctioneerProfile = (): Participant => ({
    id: `auctioneer_${Date.now()}`,
    name: auctioneerName,
    role: 'auctioneer',
    avatar: `https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150`,
    joinedAt: new Date(),
    isActive: true,
    voiceActive: false,
    lastActivity: new Date()
  });

  const createBidderProfile = (): Participant => ({
    id: `bidder_${Date.now()}`,
    name: bidderName,
    role: 'bidder',
    avatar: `https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?auto=compress&cs=tinysrgb&w=150`,
    joinedAt: new Date(),
    isActive: true,
    voiceActive: false,
    lastActivity: new Date()
  });

  const handleStartAuction = () => {
    if (auctioneerName.trim()) {
      onRoleSelect('auctioneer', createAuctioneerProfile());
    }
  };

  const handleJoinAuction = () => {
    if (bidderName.trim() && auctionCode.trim()) {
      onRoleSelect('bidder', { 
        participant: createBidderProfile(), 
        auctionCode: auctionCode.trim() 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full">
                <Gavel className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4">Voice Auction Platform</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Experience the future of auctions with real-time voice bidding, 
              advanced speaker recognition, and seamless multi-participant support.
            </p>
            
            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Mic className="w-8 h-8 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Voice Recognition</h3>
                <p className="text-blue-100 text-sm">Advanced speech processing with real-time command extraction</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Users className="w-8 h-8 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Multi-Speaker Support</h3>
                <p className="text-blue-100 text-sm">Concurrent bidding with speaker diarization technology</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Zap className="w-8 h-8 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">Real-Time Updates</h3>
                <p className="text-blue-100 text-sm">Instant bid processing and live transcription broadcasting</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Auctioneer Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="bg-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gavel className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Start an Auction</h2>
              <p className="text-gray-600">Create and manage live voice-based auctions</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Auctioneer Name
                </label>
                <input
                  type="text"
                  value={auctioneerName}
                  onChange={(e) => setAuctioneerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-900 mb-2">Features Include:</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Real-time voice command processing</li>
                  <li>• Live participant management</li>
                  <li>• Advanced concurrency handling</li>
                  <li>• Comprehensive auction analytics</li>
                </ul>
              </div>

              <button
                onClick={handleStartAuction}
                disabled={!auctioneerName.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>Create Auction</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bidder Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Join an Auction</h2>
              <p className="text-gray-600">Participate in live auctions with voice commands</p>
            </div>

            {!showBidderForm ? (
              <div className="text-center">
                <button
                  onClick={() => setShowBidderForm(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg transition-colors"
                >
                  Join Auction
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={bidderName}
                    onChange={(e) => setBidderName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    6-Digit Auction Code
                  </label>
                  <input
                    type="text"
                    value={auctionCode}
                    onChange={(e) => setAuctionCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Voice Commands:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• "Bid 5000" - Place a bid</li>
                    <li>• "Repeat" - Hear current status</li>
                    <li>• "Leave Auction" - Exit auction</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowBidderForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleJoinAuction}
                    disabled={!bidderName.trim() || auctionCode.length !== 6}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Architecture Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Technical Architecture</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Built with advanced voice processing, real-time WebSocket communication, 
              and sophisticated concurrency handling for production-scale auctions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Shield className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Concurrency Control</h3>
              <p className="text-gray-600 text-sm">First-valid-bid allocation with timestamp-based ordering</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Mic className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Speaker Diarization</h3>
              <p className="text-gray-600 text-sm">Multi-speaker recognition and voice activity detection</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Globe className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">WebSocket Events</h3>
              <p className="text-gray-600 text-sm">Real-time bidding updates and live transcription</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <Zap className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Intent Classification</h3>
              <p className="text-gray-600 text-sm">Advanced NLP for voice command extraction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionHome;