import React from 'react';
import { Crown, Mic, MicOff } from 'lucide-react';

interface ParticipantGridProps {
  participants: any[];
  voiceActivity: Map<string, boolean>;
  currentUser: any;
}

const ParticipantGrid: React.FC<ParticipantGridProps> = ({ 
  participants, 
  voiceActivity, 
  currentUser 
}) => {
  const maxVisible = 12;
  const visibleParticipants = participants.slice(0, maxVisible);
  const remainingCount = Math.max(0, participants.length - maxVisible);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-white">
          Participants ({participants.length})
        </h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 flex-1 overflow-y-auto">
        {visibleParticipants.map((participant) => {
          const user = participant.user;
          const isCurrentUser = user._id === currentUser?._id;
          const isAuctioneer = user.role === 'auctioneer';
          const isVoiceActive = voiceActivity.get(user._id) || false;
          
          return (
            <div
              key={user._id}
              className={`relative bg-gray-800 rounded-lg p-3 m-3 flex flex-col items-center justify-center transition-all duration-300 w-32 h-32 ${
                isVoiceActive ? 'ring-2 ring-green-400 bg-green-900/20' : ''
              } ${isCurrentUser ? 'ring-2 ring-blue-400' : ''}`}
            >
              {/* Avatar */}
              <div className="relative mb-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  isAuctioneer ? 'bg-amber-500' : 'bg-blue-500'
                }`}>
                  {isAuctioneer ? (
                    <Crown className="w-6 h-6" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                
                {/* Voice indicator */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                  isVoiceActive ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  {isVoiceActive ? (
                    <Mic className="w-3 h-3 text-white" />
                  ) : (
                    <MicOff className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Name */}
              <div className="text-center">
                <p className={`text-sm font-semibold truncate max-w-full ${
                  isCurrentUser ? 'text-blue-400' : 'text-white'
                }`}>
                  {isCurrentUser ? 'You' : user.name}
                </p>
                {isAuctioneer && (
                  <p className="text-xs text-amber-400">Auctioneer</p>
                )}
              </div>
              
              {/* Speaking animation */}
              {isVoiceActive && (
                <div className="absolute inset-0 rounded-lg border-2 border-green-400 animate-pulse"></div>
              )}
            </div>
          );
        })}
        
        {/* Show remaining count if there are more participants */}
        {remainingCount > 0 && (
          <div className="bg-gray-700 rounded-lg p-3 flex flex-col items-center justify-center w-32 h-32">
            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center mb-2">
              <span className="text-white font-bold">+{remainingCount}</span>
            </div>
            <p className="text-xs text-gray-400 text-center">more</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantGrid;