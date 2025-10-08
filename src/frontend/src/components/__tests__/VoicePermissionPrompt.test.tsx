import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoicePermissionPrompt } from '../voice/VoicePermissionPrompt';

describe('VoicePermissionPrompt Component', () => {
  const mockOnRequestPermission = jest.fn();

  beforeEach(() => {
    mockOnRequestPermission.mockClear();
  });

  it('renders voice permission prompt with correct content', () => {
    render(<VoicePermissionPrompt onRequestPermission={mockOnRequestPermission} />);
    
    expect(screen.getByText('Enable Voice Access')).toBeInTheDocument();
    expect(screen.getByText(/LanguagePeer needs microphone access/i)).toBeInTheDocument();
    expect(screen.getByText(/Your audio is processed securely/i)).toBeInTheDocument();
  });

  it('renders microphone icon', () => {
    render(<VoicePermissionPrompt onRequestPermission={mockOnRequestPermission} />);
    
    const icon = screen.getByText('🎤');
    expect(icon).toBeInTheDocument();
  });

  it('renders enable microphone button', () => {
    render(<VoicePermissionPrompt onRequestPermission={mockOnRequestPermission} />);
    
    const enableButton = screen.getByRole('button', { name: /enable microphone/i });
    expect(enableButton).toBeInTheDocument();
    expect(enableButton).toHaveTextContent('🎤');
  });

  it('renders learn more button', () => {
    render(<VoicePermissionPrompt onRequestPermission={mockOnRequestPermission} />);
    
    const learnMoreButton = screen.getByRole('button', { name: /learn more/i });
    expect(learnMoreButton).toBeInTheDocument();
  });

  it('calls onRequestPermission when enable button is clicked', () => {
    render(<VoicePermissionPrompt onRequestPermission={mockOnRequestPermission} />);
    
    const enableButton = screen.getByRole('button', { name: /enable microphone/i });
    fireEvent.click(enableButton);
    
    expect(mockOnRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    render(<VoicePermissionPrompt onRequestPermission={mockOnRequestPermission} />);
    
    const prompt = screen.getByText('Enable Voice Access').closest('.voice-permission-prompt');
    expect(prompt).toBeInTheDocument();
    
    const enableButton = screen.getByRole('button', { name: /enable microphone/i });
    expect(enableButton).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<VoicePermissionPrompt onRequestPermission={mockOnRequestPermission} />);
    
    const prompt = screen.getByText('Enable Voice Access').closest('.voice-permission-prompt');
    expect(prompt).toHaveClass('voice-permission-prompt');
    
    const content = screen.getByText('Enable Voice Access').closest('.voice-permission-content');
    expect(content).toHaveClass('voice-permission-content');
  });
});