import React, { useState } from 'react';
import { X, Upload, DollarSign, Clock, Tag } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface CreateAuctionModalProps {
  onClose: () => void;
  onAuctionCreated: (auction: any) => void;
}

const CreateAuctionModal: React.FC<CreateAuctionModalProps> = ({ onClose, onAuctionCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    item: {
      title: '',
      description: '',
      imageUrl: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800',
      startingPrice: '',
      reservePrice: '',
      category: '',
      condition: 'Excellent',
      provenance: 'Private Collection'
    },
    duration: '30',
    minBidIncrement: ''
  });
  const [loading, setLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState('');

  const categories = [
    'Art & Antiques',
    'Jewelry & Watches',
    'Collectibles',
    'Electronics',
    'Vehicles',
    'Real Estate',
    'Fashion',
    'Sports Memorabilia',
    'Books & Manuscripts',
    'Other'
  ];

  const conditions = ['Mint', 'Excellent', 'Very Good', 'Good', 'Fair', 'Poor'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('item.')) {
      const itemField = name.split('.')[1];
      if (itemField === 'description') {
        if (value.length < 10 || value.length > 1000) {
          setDescriptionError('Description must be 10-1000 characters');
        } else {
          setDescriptionError('');
        }
      }
      setFormData({
        ...formData,
        item: {
          ...formData.item,
          [itemField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (descriptionError) return;
    setLoading(true);

    try {
      const auctionData = {
        ...formData,
        item: {
          ...formData.item,
          startingPrice: parseFloat(formData.item.startingPrice),
          reservePrice: formData.item.reservePrice ? parseFloat(formData.item.reservePrice) : undefined
        },
        duration: parseInt(formData.duration),
        minBidIncrement: parseFloat(formData.minBidIncrement)
      };

      const response = await api.post('/auctions', auctionData);
      onAuctionCreated(response.data.data.auction);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Create New Auction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Auction Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Auction Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter auction title"
              required
            />
          </div>

          {/* Item Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Item Title
              </label>
              <input
                type="text"
                name="item.title"
                value={formData.item.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter item title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="item.description"
                value={formData.item.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the item in detail"
                required
              />
              {descriptionError && (
                <p className="text-red-500 text-sm mt-1">{descriptionError}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    name="item.category"
                    value={formData.item.category}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  name="item.condition"
                  value={formData.item.condition}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Starting Price ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="item.startingPrice"
                    value={formData.item.startingPrice}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reserve Price ($) <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    name="item.reservePrice"
                    value={formData.item.reservePrice}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Provenance
              </label>
              <input
                type="text"
                name="item.provenance"
                value={formData.item.provenance}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Item provenance or source"
              />
            </div>
          </div>

          {/* Auction Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Settings</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  max="180"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Minimum Bid Increment ($)
            </label>
            <input
              type="number"
              name="minBidIncrement"
              value={formData.minBidIncrement}
              onChange={handleInputChange}
              min="1"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter minimum bid increment"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Create Auction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuctionModal;