import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, DollarSign, Clock, Play, Eye, Trash2 } from 'lucide-react';
import api from '../../services/api';

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
  onDelete?: (auctionId: string) => void;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction, userRole, onDelete }) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking delete
    if ((e.target as HTMLElement).closest('.delete-btn')) return;
    navigate(`/auction/${auction._id}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/auctions/${auction._id}`);
      setShowConfirm(false);
      if (onDelete) onDelete(auction._id);
    } catch (err) {
      alert('Failed to delete auction.');
    } finally {
      setDeleting(false);
    }
  };

  const currentBid = auction.bids.length > 0 
    ? Math.max(...auction.bids.map(b => b.amount))
    : auction.item.startingPrice;

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden relative"
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
          <div className="flex items-center space-x-3">
            <span className="text-blue-500 font-semibold">
              {userRole === 'auctioneer' ? 'Manage' : 'Join'}
            </span>
            {userRole === 'auctioneer' && (
              <button
                className="delete-btn flex items-center space-x-1 text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors border border-red-200 hover:border-red-400"
                onClick={e => { e.stopPropagation(); setShowConfirm(true); }}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-xs">
            <h4 className="text-lg font-bold mb-4 text-gray-900">Delete Auction?</h4>
            <p className="text-gray-700 mb-6">Are you sure you want to delete <span className="font-semibold">{auction.title}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionCard;