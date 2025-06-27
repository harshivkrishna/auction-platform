import React from 'react';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

interface BidHistoryProps {
  bids: any[];
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids }) => {
  const sortedBids = [...bids].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">
            Bid History ({bids.length})
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedBids.length > 0 ? (
          sortedBids.map((bid, index) => (
            <div
              key={bid.id || bid._id || index}
              className={`p-3 rounded-lg transition-all duration-300 ${
                index === 0 
                  ? 'bg-green-900/30 border border-green-500/30' 
                  : 'bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-white">
                    ${bid.amount.toLocaleString()}
                  </span>
                  {index === 0 && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      HIGHEST
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-300 mb-1">
                {bid.bidder?.name || bid.bidderName || 'Anonymous'}
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(bid.timestamp).toLocaleTimeString()}
                </span>
                {bid.confidence && (
                  <>
                    <span>•</span>
                    <span>{Math.round(bid.confidence * 100)}% confidence</span>
                  </>
                )}
              </div>
              
              {bid.transcription && (
                <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300">
                  "{bid.transcription}"
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No bids yet</p>
            <p className="text-gray-500 text-sm">Be the first to place a bid!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidHistory;