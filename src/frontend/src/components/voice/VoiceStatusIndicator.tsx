import React from 'react';
import './VoiceStatusIndicator.css';

interface VoiceStatusIndicatorProps {
  isListening: boolean;
  className?: string;
}

export const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({
  isListening,
  className = ''
}) => {
  return (
    <div 
      className={`voice-status ${isListening ? 'voice-status--listening' : ''} ${className}`}
      role="status"
      aria-label={isListening ? 'Listening for voice input' : 'Voice input inactive'}
    >
      <div className="voice-status-icon">
        {isListening ? '🎤' : '🔇'}
      </div>
      <div className="voice-status-indicator">
        <div className="voice-status-dot"></div>
      </div>
    </div>
  );
};