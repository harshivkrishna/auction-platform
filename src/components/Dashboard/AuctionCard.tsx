import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, DollarSign, Clock, Play, Eye } from 'lucide-react';

interface AuctionCardProps {
  auction: {
    _id: string;
    code: string;
    title: string;
    item: {
      title: string;
      description: string;
      imageUrl: string;
      startingPrice: number;
      category: string;
    };
    status: 'waiting' | 'active' | 'paused' | 'ended';
    participants: any[];
    bids: any[];
    createdAt: string;
    startTime?: string;
    endTime?: string;
  };
  userRole: string;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction, userRole }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'waiting': return <Clock className="w-4 h-4" />;
      case 'ended': return <Eye className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleCardClick = () => {
    navigate(`/auction/${auction._id}`);
  };

  const currentBid = auction.bids.length > 0 
    ? Math.max(...auction.bids.map(b => b.amount))
    : auction.item.startingPrice;

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="relative">
        <img 
          src={auction.item.imageUrl} 
          alt={auction.item.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(auction.status)}`}>
            {getStatusIcon(auction.status)}
            <span className="capitalize">{auction.status}</span>
          </span>
        </div>
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-mono">
          #{auction.code}
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{auction.title}</h3>
          <p className="text-gray-600 text-sm">{auction.item.category}</p>
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {auction.item.description}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Current Bid</p>
              <p className="font-bold text-gray-900">${currentBid.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Participants</p>
              <p className="font-bold text-gray-900">{auction.participants.length}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>
              {auction.status === 'active' && auction.startTime
                ? `Started ${new Date(auction.startTime).toLocaleTimeString()}`
                : auction.status === 'ended' && auction.endTime
                ? `Ended ${new Date(auction.endTime).toLocaleTimeString()}`
                : `Created ${new Date(auction.createdAt).toLocaleDateString()}`
              }
            </span>
          </div>
          <span className="text-blue-500 font-semibold">
            {userRole === 'auctioneer' ? 'Manage' : 'Join'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuctionCard;