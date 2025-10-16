import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { useVoiceTranscription } from '../../hooks/useVoiceTranscription';
import { formatDuration } from '../../utils/timeUtils';
import './VoiceRecorder.css';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, transcript: string) => void;
  onTranscriptUpdate?: (transcript: string, isPartial: boolean) => void;
  onError?: (error: string) => void;
  maxDuration?: number; // in seconds
  autoTranscribe?: boolean;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onTranscriptUpdate,
  onError,
  maxDuration = 300, // 5 minutes default
  autoTranscribe = true,
  className = ''
}) => {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error: recordingError,
    isSupported: recordingSupported,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording
  } = useVoiceRecording();

  const {
    isTranscribing,
    currentTranscript,
    finalTranscript,
    confidence,
    error: transcriptionError,
    startTranscription,
    stopTranscription,
    clearTranscription
  } = useVoiceTranscription();

  // Handle errors
  useEffect(() => {
    const error = recordingError || transcriptionError;
    if (error && onError) {
      onError(error);
    }
  }, [recordingError, transcriptionError, onError]);

  // Handle transcript updates
  useEffect(() => {
    if (onTranscriptUpdate) {
      const fullTranscript = finalTranscript + currentTranscript;
      onTranscriptUpdate(fullTranscript, !!currentTranscript);
    }
  }, [currentTranscript, finalTranscript, onTranscriptUpdate]);

  // Auto-stop recording when max duration is reached
  useEffect(() => {
    if (isRecording && duration >= maxDuration) {
      handleStopRecording();
    }
  }, [isRecording, duration, maxDuration]);

  // Handle recording completion
  useEffect(() => {
    if (audioBlob && !isRecording && onRecordingComplete) {
      onRecordingComplete(audioBlob, finalTranscript);
    }
  }, [audioBlob, isRecording, finalTranscript]);

  const handleStartRecording = async () => {
    clearRecording();
    clearTranscription();
    
    await startRecording();
    
    if (autoTranscribe) {
      setTimeout(() => {
        startTranscription();
      }, 100); // Small delay to ensure recording has started
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    
    if (autoTranscribe && isTranscribing) {
      stopTranscription();
    }
  };

  const handlePauseRecording = () => {
    pauseRecording();
    
    if (autoTranscribe && isTranscribing) {
      stopTranscription();
    }
  };

  const handleResumeRecording = () => {
    resumeRecording();
    
    if (autoTranscribe) {
      startTranscription();
    }
  };

  const handleClearRecording = () => {
    clearRecording();
    clearTranscription();
  };

  if (!recordingSupported) {
    return <TextInputFallback onMessageSend={onRecordingComplete} className={className} />;
  }

  const isActive = isRecording || isTranscribing;
  const hasRecording = !!audioBlob;
  const progressPercentage = (duration / maxDuration) * 100;

  return (
    <div className={`voice-recorder ${isActive ? 'voice-recorder--active' : ''} ${className}`}>
      {/* Recording Status */}
      <div className="voice-recorder-status">
        <div className="voice-recorder-indicator">
          <div 
            className={`voice-recorder-dot ${isRecording ? 'voice-recorder-dot--recording' : ''} ${isPaused ? 'voice-recorder-dot--paused' : ''}`}
          />
          <span className="voice-recorder-status-text">
            {isRecording && !isPaused && 'Recording...'}
            {isRecording && isPaused && 'Paused'}
            {!isRecording && hasRecording && 'Recording Complete'}
            {!isRecording && !hasRecording && 'Ready to Record'}
          </span>
        </div>
        
        {isRecording && (
          <div className="voice-recorder-duration">
            {formatDuration(duration)} / {formatDuration(maxDuration)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isRecording && (
        <div className="voice-recorder-progress">
          <div 
            className="voice-recorder-progress-bar"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="voice-recorder-controls">
        {!isRecording && !hasRecording && (
          <Button
            variant="primary"
            size="large"
            onClick={handleStartRecording}
            leftIcon="🎤"
            className="voice-recorder-start-btn"
          >
            Start Recording
          </Button>
        )}

        {isRecording && !isPaused && (
          <>
            <Button
              variant="secondary"
              onClick={handlePauseRecording}
              leftIcon="⏸️"
            >
              Pause
            </Button>
            <Button
              variant="outline"
              onClick={handleStopRecording}
              leftIcon="⏹️"
            >
              Stop
            </Button>
          </>
        )}

        {isRecording && isPaused && (
          <>
            <Button
              variant="primary"
              onClick={handleResumeRecording}
              leftIcon="▶️"
            >
              Resume
            </Button>
            <Button
              variant="outline"
              onClick={handleStopRecording}
              leftIcon="⏹️"
            >
              Stop
            </Button>
          </>
        )}

        {!isRecording && hasRecording && (
          <>
            <Button
              variant="primary"
              onClick={handleStartRecording}
              leftIcon="🎤"
            >
              Record Again
            </Button>
            <Button
              variant="ghost"
              onClick={handleClearRecording}
              leftIcon="🗑️"
            >
              Clear
            </Button>
          </>
        )}
      </div>

      {/* Transcription Display */}
      {autoTranscribe && (finalTranscript || currentTranscript) && (
        <div className="voice-recorder-transcript">
          <div className="voice-recorder-transcript-header">
            <span>Live Transcription</span>
            {confidence > 0 && (
              <span className="voice-recorder-confidence">
                Confidence: {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
          <div className="voice-recorder-transcript-content">
            <span className="voice-recorder-transcript-final">{finalTranscript}</span>
            {currentTranscript && (
              <span className="voice-recorder-transcript-interim">{currentTranscript}</span>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {(recordingError || transcriptionError) && (
        <div className="voice-recorder-error">
          <span className="voice-recorder-error-icon">⚠️</span>
          <span>{recordingError || transcriptionError}</span>
        </div>
      )}
    </div>
  );
};

// Text input fallback component for when voice recording is not supported
interface TextInputFallbackProps {
  onMessageSend?: (audioBlob: Blob, transcript: string) => void;
  className?: string;
}

const TextInputFallback: React.FC<TextInputFallbackProps> = ({ onMessageSend, className }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !onMessageSend) return;

    setIsLoading(true);
    
    // Create a mock audio blob for compatibility
    const mockAudioBlob = new Blob([''], { type: 'audio/wav' });
    
    try {
      await onMessageSend(mockAudioBlob, message.trim());
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`voice-recorder voice-recorder--text-mode ${className}`}>
      <div className="voice-recorder-fallback-notice">
        <div className="voice-recorder-notice-header">
          <span className="voice-recorder-notice-icon">💬</span>
          <h3>Text Mode</h3>
        </div>
        <p>Voice recording requires HTTPS. You can still practice by typing your messages!</p>
        <div className="voice-recorder-notice-details">
          <p><strong>To enable voice recording:</strong></p>
          <ul>
            <li>Access the app via HTTPS (recommended for production)</li>
            <li>Or run locally on localhost with HTTPS</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="voice-recorder-text-form">
        <div className="voice-recorder-text-input-group">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here and press Enter to send..."
            className="voice-recorder-text-input"
            rows={3}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!message.trim() || isLoading}
            leftIcon={isLoading ? "⏳" : "📤"}
            className="voice-recorder-send-btn"
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
        <div className="voice-recorder-text-hint">
          <span>💡 Tip: Press Enter to send, Shift+Enter for new line</span>
        </div>
      </form>
    </div>
  );
};