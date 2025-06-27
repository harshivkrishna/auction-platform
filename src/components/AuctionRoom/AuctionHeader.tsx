import React, { useEffect, useState } from 'react';
import { LogOut, Users, Clock, Hash, DollarSign } from 'lucide-react';

interface AuctionHeaderProps {
  auction: {
    code: string;
    title: string;
    status: string;
    participants: any[];
    startTime?: string;
  };
  currentBidAmount?: number;
  onLeave: () => void;
}

const AuctionHeader: React.FC<AuctionHeaderProps> = ({ auction, currentBidAmount, onLeave }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = () => {
    if (!auction.startTime) return '00:00';
    
    const start = new Date(auction.startTime);
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'waiting': return 'text-yellow-400';
      case 'ended': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl font-bold text-white">{auction.title}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300 font-mono">{auction.code}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  auction.status === 'active' ? 'bg-green-400' : 
                  auction.status === 'waiting' ? 'bg-yellow-400' : 'bg-red-400'
                }`}></div>
                <span className={`capitalize font-semibold ${getStatusColor(auction.status)}`}>
                  {auction.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Current Bid Amount */}
          {currentBidAmount && (
            <div className="flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-lg">
                ${currentBidAmount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-4 text-gray-300">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>{auction.participants.length} participants</span>
            </div>
            {auction.status === 'active' && (
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="font-mono">{getElapsedTime()}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={onLeave}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionHeader;