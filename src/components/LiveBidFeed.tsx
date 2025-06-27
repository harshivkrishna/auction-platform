import React from 'react';
import { DollarSign, Clock, User, TrendingUp } from 'lucide-react';
import { Auction } from '../types/auction';

interface LiveBidFeedProps {
  auction: Auction;
}

const LiveBidFeed: React.FC<LiveBidFeedProps> = ({ auction }) => {
  const sortedBids = [...auction.bids].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const recentBids = sortedBids.slice(0, 10);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-emerald-500" />
          Live Bid Feed
        </h3>
        <div className="bg-emerald-100 px-3 py-1 rounded-full">
          <span className="text-emerald-800 font-semibold">{auction.bids.length} Total Bids</span>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {recentBids.map((bid, index) => (
          <div 
            key={bid.id} 
            className={`p-4 rounded-lg border-l-4 transition-all duration-300 ${
              index === 0 && bid.status === 'accepted'
                ? 'bg-emerald-50 border-emerald-500 shadow-md'
                : bid.status === 'accepted'
                ? 'bg-blue-50 border-blue-500'
                : 'bg-gray-50 border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  bid.status === 'accepted' ? 'bg-emerald-500' : 'bg-gray-400'
                }`}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{bid.bidderName}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{bid.timestamp.toLocaleTimeString()}</span>
                    <span>•</span>
                    <span>{Math.round(bid.confidence * 100)}% confidence</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <span className="text-2xl font-bold text-gray-900">
                    {bid.amount.toLocaleString()}
                  </span>
                </div>
                <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  bid.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                  bid.status === 'superseded' ? 'bg-yellow-100 text-yellow-800' :
                  bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {bid.status.toUpperCase()}
                </div>
              </div>
            </div>
            
            {bid.transcription && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Voice Command:</span> "{bid.transcription}"
                </p>
              </div>
            )}
          </div>
        ))}

        {auction.bids.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No bids yet</p>
            <p className="text-gray-400">Waiting for participants to start bidding...</p>
          </div>
        )}
      </div>

      {auction.bids.length > 10 && (
        <div className="mt-4 text-center">
          <p className="text-gray-500">Showing latest 10 of {auction.bids.length} bids</p>
        </div>
      )}
    </div>
  );
};

export default LiveBidFeed;