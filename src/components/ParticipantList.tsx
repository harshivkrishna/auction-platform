import React from 'react';
import { User, Crown, Mic, MicOff } from 'lucide-react';
import { Participant } from '../types/auction';

interface ParticipantListProps {
  participants: Participant[];
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants }) => {
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.role === 'auctioneer' && b.role !== 'auctioneer') return -1;
    if (b.role === 'auctioneer' && a.role !== 'auctioneer') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <User className="w-5 h-5 mr-2 text-blue-500" />
        Participants ({participants.length})
      </h3>
      
      <div className="space-y-3">
        {sortedParticipants.map((participant) => (
          <div 
            key={participant.id} 
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              participant.isActive ? 'bg-gray-50' : 'bg-red-50'
            }`}
          >
            <div className="relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                participant.role === 'auctioneer' 
                  ? 'bg-amber-500' 
                  : participant.isActive 
                  ? 'bg-blue-500' 
                  : 'bg-gray-400'
              }`}>
                {participant.role === 'auctioneer' ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
              
              {participant.voiceActive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Mic className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className="font-semibold text-gray-900">{participant.name}</p>
                {participant.role === 'auctioneer' && (
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold">
                    Auctioneer
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Joined {participant.joinedAt.toLocaleTimeString()}</span>
                {!participant.isActive && (
                  <>
                    <span>•</span>
                    <span className="text-red-600">Offline</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-right">
              {participant.voiceActive ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Mic className="w-4 h-4" />
                  <span className="text-xs">Speaking</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-gray-400">
                  <MicOff className="w-4 h-4" />
                  <span className="text-xs">Quiet</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantList;