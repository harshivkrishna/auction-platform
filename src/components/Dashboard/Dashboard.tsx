import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Filter, Calendar, Users, DollarSign, Clock } from 'lucide-react';
import api from '../../services/api';
import CreateAuctionModal from './CreateAuctionModal';
import JoinAuctionModal from './JoinAuctionModal';
import AuctionCard from './AuctionCard';
import toast from 'react-hot-toast';

interface Auction {
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
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await api.get('/auctions/my-auctions');
      setAuctions(response.data.data.auctions);
    } catch (error: any) {
      toast.error('Failed to fetch auctions');
      console.error('Fetch auctions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuctionCreated = (newAuction: Auction) => {
    setAuctions([newAuction, ...auctions]);
    setShowCreateModal(false);
    toast.success('Auction created successfully!');
  };

  const handleAuctionJoined = (joinedAuction: Auction) => {
    setAuctions([joinedAuction, ...auctions]);
    setShowJoinModal(false);
    toast.success('Successfully joined auction!');
  };

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         auction.item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || auction.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: auctions.length,
    active: auctions.filter(a => a.status === 'active').length,
    waiting: auctions.filter(a => a.status === 'waiting').length,
    ended: auctions.filter(a => a.status === 'ended').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'auctioneer' ? 'Auctioneer Dashboard' : 'Bidder Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'auctioneer' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Auction</span>
                </button>
              )}
              {user?.role === 'bidder' && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>Join Auction</span>
                </button>
              )}
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-gray-600">Total Auctions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-gray-600">Active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.waiting}</p>
                <p className="text-gray-600">Waiting</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stats.ended}</p>
                <p className="text-gray-600">Ended</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search auctions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="waiting">Waiting</option>
                  <option value="active">Active</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Auctions Grid */}
        {filteredAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAuctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} userRole={user?.role || 'bidder'} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No auctions found</h3>
            <p className="text-gray-600 mb-6">
              {user?.role === 'auctioneer' 
                ? "You haven't created any auctions yet." 
                : "You haven't joined any auctions yet."}
            </p>
            {user?.role === 'auctioneer' ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Your First Auction
              </button>
            ) : (
              <button
                onClick={() => setShowJoinModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Join an Auction
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAuctionModal
          onClose={() => setShowCreateModal(false)}
          onAuctionCreated={handleAuctionCreated}
        />
      )}

      {showJoinModal && (
        <JoinAuctionModal
          onClose={() => setShowJoinModal(false)}
          onAuctionJoined={handleAuctionJoined}
        />
      )}
    </div>
  );
};

export default Dashboard;