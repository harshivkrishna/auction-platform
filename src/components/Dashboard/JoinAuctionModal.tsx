import React, { useState } from 'react';
import { X, Users, Hash } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface JoinAuctionModalProps {
  onClose: () => void;
  onAuctionJoined: (auction: any) => void;
}

const JoinAuctionModal: React.FC<JoinAuctionModalProps> = ({ onClose, onAuctionJoined }) => {
  const [auctionCode, setAuctionCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (auctionCode.length !== 6) {
      toast.error('Auction code must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(`/auctions/join/${auctionCode}`);
      onAuctionJoined(response.data.data.auction);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join auction');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAuctionCode(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Join Auction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="text-center mb-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600">
              Enter the 6-digit auction code to join an active auction
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Auction Code
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={auctionCode}
                onChange={handleCodeChange}
                className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Ask the auctioneer for the 6-digit code
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || auctionCode.length !== 6}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span>Join Auction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinAuctionModal;