import React from 'react';
import { Button } from '../ui/Button';
import './VoicePermissionPrompt.css';

interface VoicePermissionPromptProps {
  onRequestPermission: () => void;
}

export const VoicePermissionPrompt: React.FC<VoicePermissionPromptProps> = ({
  onRequestPermission
}) => {
  return (
    <div className="voice-permission-prompt">
      <div className="voice-permission-content">
        <div className="voice-permission-icon">🎤</div>
        <h3 className="voice-permission-title">Enable Voice Access</h3>
        <p className="voice-permission-description">
          LanguagePeer needs microphone access to provide voice-based language learning. 
          Your audio is processed securely and never stored without your permission.
        </p>
        <div className="voice-permission-actions">
          <Button
            variant="primary"
            onClick={onRequestPermission}
            leftIcon="🎤"
          >
            Enable Microphone
          </Button>
          <Button variant="ghost" size="small">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};