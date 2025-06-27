import { VoiceCommand } from '../types/auction';
import { wordsToNumbers } from 'words-to-numbers';

export class VoiceService {
  private isListening = false;
  private recognition: any = null;
  private onCommandCallback: ((command: VoiceCommand) => void) | null = null;

  constructor() {
    console.log('[VoiceService] Constructor called');
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    console.log('[VoiceService] initializeSpeechRecognition called');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      console.log('[VoiceService] Initializing SpeechRecognition');
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      console.log('[VoiceService] SpeechRecognition initialized');
    } else {
      this.recognition = null;
      console.warn('[VoiceService] Web Speech API is not supported in this browser.');
    }
  }

  // Extract intent and value from voice command
  private extractCommandIntent(text: string): { intent: VoiceCommand['intent'], value?: number } {
    const lowercaseText = text.toLowerCase().trim();
    // Convert words to numbers (e.g., "five thousand" -> "5000")
    let normalizedText: string;
    const numberified = wordsToNumbers(lowercaseText);
    if (numberified !== null && numberified !== undefined) {
      normalizedText = numberified.toString();
    } else {
      normalizedText = lowercaseText;
    }
    
    // Bid patterns
    const bidPatterns = [
      /bid\s+(\d+)/i,
      /(\d+)\s*dollars?/i,
      /i\s+bid\s+(\d+)/i,
      /bidding\s+(\d+)/i
    ];

    for (const pattern of bidPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        return { intent: 'bid', value: parseInt(match[1]) };
      }
    }

    // Other command patterns
    if (lowercaseText.includes('repeat') || lowercaseText.includes('what') || lowercaseText.includes('current')) {
      return { intent: 'repeat' };
    }
    
    if (lowercaseText.includes('leave') || lowercaseText.includes('exit') || lowercaseText.includes('quit')) {
      return { intent: 'leave' };
    }
    
    if (lowercaseText.includes('end auction') || lowercaseText.includes('close auction')) {
      return { intent: 'end_auction' };
    }

    return { intent: 'unknown' };
  }

  // Simulate voice command processing
  simulateVoiceCommand(participantId: string, participantName: string, commandText: string): VoiceCommand {
    const { intent, value } = this.extractCommandIntent(commandText);
    const confidence = 0.85 + Math.random() * 0.15;
    const command: VoiceCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participantId,
      participantName,
      command: commandText,
      intent,
      confidence,
      timestamp: new Date(),
      transcription: commandText,
      extractedValue: value,
      status: 'processing',
      // Add a warning if confidence is low
      ...(confidence < 0.8 ? { warning: 'Low confidence in voice recognition. Please try again.' } : {})
    };

    return command;
  }

  // Start listening for voice commands
  startListening(participantId: string, participantName: string, onCommand: (command: VoiceCommand) => void) {
    console.log('[VoiceService] startListening called', participantId, participantName);
    this.isListening = true;
    this.onCommandCallback = onCommand;
    if (!this.recognition) {
      console.warn('[VoiceService] Speech recognition is not available.');
      return;
    }
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      console.log('[VoiceService] Recognized:', transcript, 'Confidence:', confidence);
      const { intent, value } = this.extractCommandIntent(transcript);
      const command: VoiceCommand = {
        id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participantId,
        participantName,
        command: transcript,
        intent,
        confidence,
        timestamp: new Date(),
        transcription: transcript,
        extractedValue: value,
        status: 'processing',
        ...(confidence < 0.8 ? { warning: 'Low confidence in voice recognition. Please try again.' } : {})
      };
      if (this.onCommandCallback) {
        this.onCommandCallback(command);
      }
    };
    this.recognition.onerror = (event: any) => {
      console.error('[VoiceService] Speech recognition error:', event.error);
    };
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('[VoiceService] Speech recognition ended');
    };
    try {
      this.recognition.start();
      console.log(`[VoiceService] Voice listening started for ${participantName}`);
    } catch (err) {
      console.error('[VoiceService] Error starting recognition:', err);
    }
  }

  // Stop listening
  stopListening() {
    console.log('[VoiceService] stopListening called');
    this.isListening = false;
    this.onCommandCallback = null;
    if (this.recognition) {
      this.recognition.stop();
    }
    console.log('Voice listening stopped');
  }

  // Check if currently listening
  getIsListening(): boolean {
    return this.isListening;
  }

  // Simulate speaker diarization (identifying who is speaking)
  simulateSpeakerDiarization(voiceData: any): { speakerId: string, confidence: number } {
    // In a real implementation, this would use sophisticated audio processing
    return {
      speakerId: `speaker_${Math.floor(Math.random() * 10)}`,
      confidence: 0.9 + Math.random() * 0.1
    };
  }

  // Process audio for multiple speakers
  processMultiSpeakerAudio(audioBuffer: ArrayBuffer): Array<{
    speakerId: string;
    text: string;
    confidence: number;
    timestamp: Date;
  }> {
    // Simulate multi-speaker processing
    // In production, this would use services like Google Cloud Speech-to-Text with diarization
    return [];
  }
}

export const voiceService = new VoiceService();