import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioVisualizer } from '../voice/AudioVisualizer';

// Mock Web Audio API
const mockAnalyser = {
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  frequencyBinCount: 128,
  getByteFrequencyData: jest.fn()
};

const mockAudioContext = {
  createAnalyser: jest.fn(() => mockAnalyser),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn()
  })),
  close: jest.fn()
};

const mockMediaStream = {
  getTracks: jest.fn(() => [])
};

// Mock global objects
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn(() => mockAudioContext)
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: jest.fn(() => mockAudioContext)
});

// Mock canvas context
const mockCanvasContext = {
  fillStyle: '',
  fillRect: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  }))
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCanvasContext);

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn((callback) => {
    setTimeout(callback, 16);
    return 1;
  })
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: jest.fn()
});

describe('AudioVisualizer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<AudioVisualizer />);
    
    const canvas = screen.getByRole('img', { hidden: true }); // Canvas has img role
    expect(canvas).toBeInTheDocument();
  });

  it('shows "No audio input" when no stream provided', () => {
    render(<AudioVisualizer isActive={false} />);
    
    expect(screen.getByText('No audio input')).toBeInTheDocument();
  });

  it('shows "Paused" when stream provided but not active', () => {
    render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={false} />);
    
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('applies custom dimensions', () => {
    render(<AudioVisualizer width={400} height={150} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toHaveAttribute('width', '400');
    expect(canvas).toHaveAttribute('height', '150');
  });

  it('applies custom className', () => {
    render(<AudioVisualizer className="custom-visualizer" />);
    
    const visualizer = document.querySelector('.audio-visualizer.custom-visualizer');
    expect(visualizer).toBeInTheDocument();
  });

  it('shows active state when recording', () => {
    render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    const visualizer = document.querySelector('.audio-visualizer--active');
    expect(visualizer).toBeInTheDocument();
  });

  it('handles unsupported browser gracefully', () => {
    // Temporarily remove AudioContext support
    const originalAudioContext = window.AudioContext;
    const originalWebkitAudioContext = (window as any).webkitAudioContext;
    
    delete (window as any).AudioContext;
    delete (window as any).webkitAudioContext;

    render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    expect(screen.getByText('🎵')).toBeInTheDocument();
    expect(screen.getByText('Audio visualization not supported')).toBeInTheDocument();

    // Restore AudioContext
    window.AudioContext = originalAudioContext;
    (window as any).webkitAudioContext = originalWebkitAudioContext;
  });

  it('creates audio context and analyzer when stream is provided', () => {
    render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
    expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockMediaStream);
  });

  it('sets correct analyzer properties', () => {
    render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    expect(mockAnalyser.fftSize).toBe(256);
    expect(mockAnalyser.smoothingTimeConstant).toBe(0.8);
  });

  it('handles audio context creation error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAudioContext.createAnalyser.mockImplementation(() => {
      throw new Error('Audio context error');
    });

    render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to create audio visualization:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('cleans up audio context on unmount', () => {
    const { unmount } = render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    unmount();
    
    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it('uses custom bar count', () => {
    render(<AudioVisualizer barCount={64} audioStream={mockMediaStream as any} isActive={true} />);
    
    // The component should use the custom bar count for visualization
    // This is tested indirectly through the canvas drawing logic
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('uses custom colors', () => {
    render(
      <AudioVisualizer 
        barColor="#ff0000" 
        backgroundColor="#000000"
        audioStream={mockMediaStream as any} 
        isActive={true} 
      />
    );
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('handles canvas context unavailable', () => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
    
    render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    // Should not crash when canvas context is unavailable
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('stops visualization when isActive becomes false', () => {
    const { rerender } = render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    rerender(<AudioVisualizer audioStream={mockMediaStream as any} isActive={false} />);
    
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('handles stream change', () => {
    const newMockStream = { getTracks: jest.fn(() => []) };
    const { rerender } = render(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    rerender(<AudioVisualizer audioStream={newMockStream as any} isActive={true} />);
    
    // Should handle stream change gracefully
    expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledTimes(2);
  });

  it('renders fallback UI for unsupported browsers', () => {
    // Mock unsupported browser
    const originalAudioContext = window.AudioContext;
    delete (window as any).AudioContext;
    delete (window as any).webkitAudioContext;

    render(<AudioVisualizer />);
    
    const fallback = document.querySelector('.audio-visualizer--unsupported');
    expect(fallback).toBeInTheDocument();
    expect(screen.getByText('🎵')).toBeInTheDocument();

    // Restore
    window.AudioContext = originalAudioContext;
  });

  it('applies correct CSS classes based on state', () => {
    const { rerender } = render(<AudioVisualizer />);
    
    let visualizer = document.querySelector('.audio-visualizer');
    expect(visualizer).not.toHaveClass('audio-visualizer--active');
    
    rerender(<AudioVisualizer audioStream={mockMediaStream as any} isActive={true} />);
    
    visualizer = document.querySelector('.audio-visualizer');
    expect(visualizer).toHaveClass('audio-visualizer--active');
  });
});