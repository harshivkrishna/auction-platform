import React, { useState, useEffect } from 'react';
import { Mic, Volume2 } from 'lucide-react';

const VoiceVisualization: React.FC = () => {
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(12).fill(0));
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setAudioLevels(levels => 
        levels.map(() => Math.random() * 100)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isAnimating]);

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Mic className="w-6 h-6" />
          <h3 className="text-lg font-bold">Voice Active</h3>
        </div>
        <p className="text-blue-100">Listening for voice commands...</p>
      </div>

      {/* Audio Visualization */}
      <div className="flex items-end justify-center space-x-1 h-24 mb-6">
        {audioLevels.map((level, index) => (
          <div
            key={index}
            className="bg-white/80 rounded-full transition-all duration-100 ease-out"
            style={{
              width: '8px',
              height: `${Math.max(4, level)}%`,
              opacity: 0.7 + (level / 100) * 0.3
            }}
          />
        ))}
      </div>

      {/* Speaking Indicators */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <Volume2 className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Speaker Detection</p>
          <p className="text-xs text-blue-100">Multi-speaker ready</p>
        </div>
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-green-400 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm">Voice Processing</p>
          <p className="text-xs text-blue-100">Ready for commands</p>
        </div>
      </div>

      {/* Command Examples */}
      <div className="mt-6 p-4 bg-white/10 rounded-lg">
        <p className="text-sm font-semibold mb-2">Voice Commands:</p>
        <div className="text-xs text-blue-100 space-y-1">
          <p>• "Bid 5000" - Place a bid</p>
          <p>• "Repeat" - Hear current status</p>
          <p>• "Leave Auction" - Exit auction</p>
        </div>
      </div>
    </div>
  );
};

export default VoiceVisualization;