import React from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

interface CurrentBidDisplayProps {
  currentBid: number;
  bidderName?: string;
  bidder?: any;
  itemTitle: string;
  status: string;
}

const CurrentBidDisplay: React.FC<CurrentBidDisplayProps> = ({
  currentBid,
  bidderName,
  bidder,
  itemTitle,
  status
}) => {
  const displayBidderName = bidder?.name || bidderName;
  return (
    <div className="text-center">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-300 mb-2">{itemTitle}</h2>
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'active' ? 'bg-green-400 animate-pulse' : 
            status === 'waiting' ? 'bg-yellow-400' : 'bg-red-400'
          }`}></div>
          <span className="text-gray-400 capitalize">{status}</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center mb-4">
          <DollarSign className="w-8 h-8 text-white mr-2" />
          <span className="text-white text-lg font-semibold">
            {displayBidderName ? 'Current Highest Bid' : 'Starting Price'}
          </span>
        </div>
        
        <div className="text-6xl font-bold text-white mb-4">
          ${currentBid.toLocaleString()}
        </div>
        
        {displayBidderName && (
          <div className="flex items-center justify-center space-x-2 text-blue-100">
            <TrendingUp className="w-5 h-5" />
            <span>by {displayBidderName}</span>
          </div>
        )}
        
        {!displayBidderName && status === 'waiting' && (
          <div className="text-blue-100">
            Waiting for auction to start
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentBidDisplay;