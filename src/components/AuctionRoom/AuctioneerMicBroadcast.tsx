import React, { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { socketService } from '../../services/socketService';

interface AuctioneerMicBroadcastProps {
  auctionId: string;
}

const AuctioneerMicBroadcast: React.FC<AuctioneerMicBroadcastProps> = ({ auctionId }) => {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startBroadcast = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          // Send audio chunk to server
          socketService.emitAuctioneerAudioChunk(auctionId, event.data);
        }
      };

      mediaRecorder.start(200); // send audio every 200ms
      setIsBroadcasting(true);
    } catch (err) {
      alert('Could not access microphone.');
    }
  };

  const stopBroadcast = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsBroadcasting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center mt-4">
      <button
        onClick={isBroadcasting ? stopBroadcast : startBroadcast}
        className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 mb-2 ${
          isBroadcasting
            ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50'
            : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
        }`}
      >
        {isBroadcasting ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
      </button>
      <span className="text-white text-sm">
        {isBroadcasting ? 'Broadcasting to participants...' : 'Broadcast mic to all participants'}
      </span>
    </div>
  );
};

export default AuctioneerMicBroadcast; 