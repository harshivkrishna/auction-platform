import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Plus, Send } from 'lucide-react';

interface VoiceControlsProps {
  onVoiceCommand: (command: string, confidence?: number) => void;
  onManualBid: (amount: number) => void;
  onVoiceActivity: (isActive: boolean) => void;
  currentBid: number;
  minIncrement: number;
  isActive: boolean;
}

interface PendingBid {
  id: string;
  amount: number;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  onVoiceCommand,
  onManualBid,
  onVoiceActivity,
  currentBid,
  minIncrement,
  isActive
}) => {
  const [isListening, setIsListening] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const [lastCommand, setLastCommand] = useState<string>('');
  const [pendingBids, setPendingBids] = useState<PendingBid[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isListening) {
      // Simulate audio levels for visualization
      intervalRef.current = setInterval(() => {
        setAudioLevels(levels => 
          levels.map(() => Math.random() * 100)
        );
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setAudioLevels(new Array(20).fill(0));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isListening]);

  // Auto-clear pending bids after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setPendingBids(prev => prev.filter(bid => 
        Date.now() - bid.timestamp.getTime() < 10000 // Keep for 10 seconds
      ));
    }, 1000);
    return () => clearTimeout(timer);
  }, [pendingBids]);

  const addPendingBid = (amount: number) => {
    const newBid: PendingBid = {
      id: Date.now().toString(),
      amount,
      timestamp: new Date(),
      status: 'pending'
    };
    setPendingBids(prev => [newBid, ...prev.slice(0, 4)]); // Keep max 5 pending bids
    return newBid.id;
  };

  const updatePendingBid = (id: string, status: 'confirmed' | 'failed') => {
    setPendingBids(prev => 
      prev.map(bid => 
        bid.id === id ? { ...bid, status } : bid
      )
    );
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Web Speech API is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      setLastCommand(transcript);
      setIsProcessing(true);
      
      // Check if it's a bid command
      const bidMatch = transcript.toLowerCase().match(/bid\s+(\d+)/);
      if (bidMatch) {
        const amount = parseInt(bidMatch[1]);
        const bidId = addPendingBid(amount);
        
        // Simulate server processing
        setTimeout(() => {
          updatePendingBid(bidId, Math.random() > 0.1 ? 'confirmed' : 'failed');
          setIsProcessing(false);
        }, 1000 + Math.random() * 2000);
      } else {
        setIsProcessing(false);
      }
      
      onVoiceCommand(transcript, confidence);
      setIsListening(false);
      onVoiceActivity(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      onVoiceActivity(false);
      setIsProcessing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      onVoiceActivity(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    onVoiceActivity(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    onVoiceActivity(false);
  };

  const simulateVoiceCommand = (command: string) => {
    setLastCommand(command);
    setIsProcessing(true);
    
    // Check if it's a bid command and add to pending
    const bidMatch = command.toLowerCase().match(/bid\s+(\d+)/);
    if (bidMatch) {
      const amount = parseInt(bidMatch[1]);
      const bidId = addPendingBid(amount);
      
      // Simulate server response
      setTimeout(() => {
        updatePendingBid(bidId, 'confirmed');
        setIsProcessing(false);
      }, 500 + Math.random() * 1000);
    } else {
      setTimeout(() => setIsProcessing(false), 500);
    }
    
    onVoiceCommand(command, 0.95);
  };

  const handleQuickBid = (amount: number) => {
    simulateVoiceCommand(`Bid ${amount}`);
    onManualBid(amount);
  };

  const quickBidAmounts = [
    currentBid + minIncrement,
    currentBid + minIncrement * 2,
    currentBid + minIncrement * 5,
    currentBid + minIncrement * 10
  ];

  const getHighestPendingBid = () => {
    const pendingAmounts = pendingBids
      .filter(bid => bid.status === 'pending' || bid.status === 'confirmed')
      .map(bid => bid.amount);
    return pendingAmounts.length > 0 ? Math.max(...pendingAmounts) : null;
  };

  const effectiveCurrentBid = getHighestPendingBid() || currentBid;

  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Voice Bidding</h3>
        <p className="text-gray-400">
          Say "Bid [amount]", "Repeat", or use quick bid buttons
        </p>
        {effectiveCurrentBid > currentBid && (
          <div className="mt-2 bg-blue-900/50 border border-blue-500/50 rounded-lg p-2">
            <p className="text-blue-300 text-sm">
              Your bid: ${effectiveCurrentBid.toLocaleString()} 
              {isProcessing && <span className="animate-pulse ml-2">Processing...</span>}
            </p>
          </div>
        )}
      </div>

      {/* Voice Visualization */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!isActive || isProcessing}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50' 
                : isProcessing
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
            } ${!isActive || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <MicOff className="w-8 h-8" />
            ) : isProcessing ? (
              <Send className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Audio Visualization */}
        <div className="flex items-end justify-center space-x-1 h-16 mb-4">
          {audioLevels.map((level, index) => (
            <div
              key={index}
              className="bg-blue-400 rounded-full transition-all duration-100 ease-out"
              style={{
                width: '4px',
                height: `${Math.max(4, level * 0.6)}%`,
                opacity: isListening ? 0.7 + (level / 100) * 0.3 : 0.3
              }}
            />
          ))}
        </div>

        {lastCommand && (
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <p className="text-green-400 text-sm">
              <Volume2 className="w-4 h-4 inline mr-2" />
              Last command: "{lastCommand}"
            </p>
          </div>
        )}
      </div>

      {/* Pending Bids Display */}
      {pendingBids.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h4 className="text-white font-semibold mb-2 text-sm">Your Recent Bids:</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pendingBids.map((bid) => (
              <div
                key={bid.id}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  bid.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                  bid.status === 'confirmed' ? 'bg-green-900/50 text-green-300' :
                  'bg-red-900/50 text-red-300'
                }`}
              >
                <span>${bid.amount.toLocaleString()}</span>
                <span className="capitalize flex items-center">
                  {bid.status === 'pending' && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2" />
                  )}
                  {bid.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Bid Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {quickBidAmounts.map((amount) => (
          <button
            key={amount}
            onClick={() => handleQuickBid(amount)}
            disabled={!isActive || isProcessing}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>${amount.toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* Voice Commands Help */}
      <div className="bg-gray-800 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-white mb-2">Voice Commands:</h4>
        <div className="text-gray-400 space-y-1">
          <p>• "Bid 5000" - Place a bid</p>
          <p>• "Repeat" - Hear current status</p>
          <p>• "Leave auction" - Exit auction</p>
        </div>
        {isProcessing && (
          <div className="mt-2 p-2 bg-blue-900/30 rounded text-blue-300 text-xs">
            <div className="flex items-center">
              <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full mr-2"></div>
              Processing your command...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceControls;