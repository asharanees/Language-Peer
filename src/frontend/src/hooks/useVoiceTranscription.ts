import { useState, useRef, useCallback, useEffect } from 'react';

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isPartial: boolean;
  timestamp: number;
}

export interface TranscriptionState {
  isTranscribing: boolean;
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  error: string | null;
  isConnected: boolean;
}

export interface TranscriptionControls {
  startTranscription: () => Promise<void>;
  stopTranscription: () => void;
  clearTranscription: () => void;
}

// Mock AWS Transcribe integration for development
// In production, this would connect to AWS Transcribe Streaming API
export const useVoiceTranscription = (): TranscriptionState & TranscriptionControls => {
  const [state, setState] = useState<TranscriptionState>({
    isTranscribing: false,
    currentTranscript: '',
    finalTranscript: '',
    confidence: 0,
    error: null,
    isConnected: false
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  // Check for browser speech recognition support
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startTranscription = useCallback(async () => {
    if (!isSupported) {
      setState(prev => ({ 
        ...prev, 
        error: 'Speech recognition is not supported in this browser' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      // Use browser's built-in speech recognition as a fallback
      // In production, this would be replaced with AWS Transcribe Streaming
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // This would be configurable based on user's target language
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setState(prev => ({ 
          ...prev, 
          isTranscribing: true, 
          isConnected: true,
          currentTranscript: '',
          finalTranscript: ''
        }));
        isListeningRef.current = true;
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        let confidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          confidence = result[0].confidence || 0.8; // Fallback confidence

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setState(prev => ({
          ...prev,
          currentTranscript: interimTranscript,
          finalTranscript: prev.finalTranscript + finalTranscript,
          confidence
        }));
      };

      recognition.onerror = (event) => {
        let errorMessage = 'Speech recognition error';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage = 'Audio capture failed. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error occurred during transcription.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        setState(prev => ({ 
          ...prev, 
          error: errorMessage,
          isTranscribing: false,
          isConnected: false
        }));
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        setState(prev => ({ 
          ...prev, 
          isTranscribing: false,
          isConnected: false,
          currentTranscript: ''
        }));
        isListeningRef.current = false;
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start transcription';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isTranscribing: false,
        isConnected: false
      }));
    }
  }, [isSupported]);

  const stopTranscription = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const clearTranscription = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTranscript: '',
      finalTranscript: '',
      confidence: 0,
      error: null
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    ...state,
    startTranscription,
    stopTranscription,
    clearTranscription
  };
};

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}