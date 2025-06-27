import React from 'react';
import { Play, Square, Pause, Settings } from 'lucide-react';

interface AuctioneerControlsProps {
  auction: {
    status: string;
    _id: string;
  };
  onStart: () => void;
  onEnd: () => void;
}

const AuctioneerControls: React.FC<AuctioneerControlsProps> = ({
  auction,
  onStart,
  onEnd
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Settings className="w-5 h-5 mr-2" />
        Auctioneer Controls
      </h3>
      
      <div className="space-y-3">
        {auction.status === 'waiting' && (
          <button
            onClick={onStart}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Start Auction</span>
          </button>
        )}
        
        {auction.status === 'active' && (
          <button
            onClick={onEnd}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Square className="w-5 h-5" />
            <span>End Auction</span>
          </button>
        )}
        
        <div className="bg-gray-700 rounded-lg p-3">
          <h4 className="font-semibold text-white mb-2">Status</h4>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              auction.status === 'active' ? 'bg-green-400' : 
              auction.status === 'waiting' ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            <span className="text-gray-300 capitalize">{auction.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctioneerControls;