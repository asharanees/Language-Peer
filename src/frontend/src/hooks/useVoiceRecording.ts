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

export const useVoiceRecording = (): VoiceRecordingState & VoiceRecordingControls => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    isSupported: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
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
      setState(prev => ({ ...prev, error: 'Audio recording is not supported in this browser' }));
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

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

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
        setState(prev => ({ 
          ...prev, 
          error: `Recording error: ${event.error?.message || 'Unknown error'}`,
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
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