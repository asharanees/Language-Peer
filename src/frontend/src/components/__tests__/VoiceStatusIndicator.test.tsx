import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoiceStatusIndicator } from '../voice/VoiceStatusIndicator';

describe('VoiceStatusIndicator Component', () => {
  it('renders with listening state', () => {
    render(<VoiceStatusIndicator isListening={true} />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('voice-status', 'voice-status--listening');
    expect(indicator).toHaveAttribute('aria-label', 'Listening for voice input');
  });

  it('renders with inactive state', () => {
    render(<VoiceStatusIndicator isListening={false} />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('voice-status');
    expect(indicator).not.toHaveClass('voice-status--listening');
    expect(indicator).toHaveAttribute('aria-label', 'Voice input inactive');
  });

  it('displays correct icon when listening', () => {
    render(<VoiceStatusIndicator isListening={true} />);
    
    const icon = screen.getByText('🎤');
    expect(icon).toBeInTheDocument();
  });

  it('displays correct icon when not listening', () => {
    render(<VoiceStatusIndicator isListening={false} />);
    
    const icon = screen.getByText('🔇');
    expect(icon).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<VoiceStatusIndicator isListening={false} className="custom-class" />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('voice-status', 'custom-class');
  });

  it('renders voice status indicator dot', () => {
    render(<VoiceStatusIndicator isListening={true} />);
    
    const dot = screen.getByRole('status').querySelector('.voice-status-dot');
    expect(dot).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(<VoiceStatusIndicator isListening={true} />);
    
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('role', 'status');
    expect(indicator).toHaveAttribute('aria-label');
  });

  it('changes state correctly when isListening prop changes', () => {
    const { rerender } = render(<VoiceStatusIndicator isListening={false} />);
    
    let indicator = screen.getByRole('status');
    expect(indicator).not.toHaveClass('voice-status--listening');
    expect(screen.getByText('🔇')).toBeInTheDocument();
    
    rerender(<VoiceStatusIndicator isListening={true} />);
    
    indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('voice-status--listening');
    expect(screen.getByText('🎤')).toBeInTheDocument();
  });
});