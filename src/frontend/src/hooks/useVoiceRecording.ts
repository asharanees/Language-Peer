import { useState, useRef, useCallback, useEffect } from 'react';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  isSupported: boolean;
}

export interface VoiceRecordingControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
}

// Check for comprehensive browser support
const checkBrowserSupport = (): boolean => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check for required APIs
  const hasMediaDevices = !!navigator.mediaDevices;
  const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
  const hasWebAudio = typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';

  // Check if we're on HTTPS or localhost (required for microphone access)
  const isSecureContext = window.isSecureContext || 
    window.location.protocol === 'https:' || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';

  return hasMediaDevices && hasGetUserMedia && hasMediaRecorder && hasWebAudio && isSecureContext;
};

export const useVoiceRecording = (): VoiceRecordingState & VoiceRecordingControls => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    isSupported: checkBrowserSupport()
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update duration while recording
  const updateDuration = useCallback(() => {
    if (state.isRecording && !state.isPaused) {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current - pausedTimeRef.current) / 1000;
      setState(prev => ({ ...prev, duration: elapsed }));
    }
  }, [state.isRecording, state.isPaused]);

  useEffect(() => {
    if (state.isRecording && !state.isPaused) {
      intervalRef.current = setInterval(updateDuration, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRecording, state.isPaused, updateDuration]);

  const startRecording = useCallback(async () => {
    if (!state.isSupported) {
      let errorMessage = 'Voice recording is not supported. ';
      
      if (typeof window === 'undefined') {
        errorMessage += 'Not running in browser environment.';
      } else if (!window.isSecureContext && window.location.protocol !== 'https:' && 
                 window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        errorMessage += 'Microphone access requires HTTPS or localhost.';
      } else if (!navigator.mediaDevices) {
        errorMessage += 'MediaDevices API not available.';
      } else if (!navigator.mediaDevices.getUserMedia) {
        errorMessage += 'getUserMedia not supported.';
      } else if (typeof MediaRecorder === 'undefined') {
        errorMessage += 'MediaRecorder API not available.';
      } else {
        errorMessage += 'Please use a modern browser like Chrome, Firefox, or Safari.';
      }
      
      setState(prev => ({ ...prev, error: errorMessage }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Try different audio formats in order of preference
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=vp8')) {
        mimeType = 'audio/webm;codecs=vp8';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
          isPaused: false
        }));

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        const errorEvent = event as any;
        setState(prev => ({ 
          ...prev, 
          error: `Recording error: ${errorEvent.error?.message || 'Unknown error'}`,
          isRecording: false,
          isPaused: false
        }));
      };

      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      
      mediaRecorder.start(100); // Collect data every 100ms for real-time processing
      
      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null
      }));

    } catch (error) {
      let errorMessage = 'Failed to start recording: ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Microphone access denied. Please allow microphone access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Audio recording not supported in this browser.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'Microphone is already in use by another application.';
        } else if (error.name === 'SecurityError') {
          errorMessage += 'Security error. Please ensure you\'re using HTTPS or localhost.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [state.isSupported]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      pausedTimeRef.current += Date.now() - startTimeRef.current;
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused]);

  const clearRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    
    setState(prev => ({
      ...prev,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      error: null
    }));
    
    chunksRef.current = [];
  }, [state.audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.audioUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording
  };
};