import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioPlayer } from '../voice/AudioPlayer';

// Mock HTML5 Audio API
const mockAudio = {
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 120,
  playbackRate: 1,
  src: ''
};

// Mock HTMLAudioElement
Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio)
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-url')
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
});

describe('AudioPlayer Component', () => {
  const mockProps = {
    audioUrl: 'test-audio.webm',
    audioBlob: new Blob(['audio data'], { type: 'audio/webm' }),
    title: 'Test Recording',
    onPlayStateChange: jest.fn(),
    onTimeUpdate: jest.fn(),
    onEnded: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAudio.currentTime = 0;
    mockAudio.duration = 120;
    mockAudio.playbackRate = 1;
  });

  it('renders with basic props', () => {
    render(<AudioPlayer audioUrl={mockProps.audioUrl} />);
    
    expect(screen.getByText('Audio Recording')).toBeInTheDocument();
    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<AudioPlayer {...mockProps} />);
    
    expect(screen.getByText('Test Recording')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<AudioPlayer {...mockProps} />);
    
    expect(screen.getByText('Loading audio...')).toBeInTheDocument();
  });

  it('shows play/pause controls after loading', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Simulate audio loaded
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      fireEvent.canPlay(audioElement);
    }

    await waitFor(() => {
      expect(screen.getByText('Play')).toBeInTheDocument();
      expect(screen.getByText('00:00')).toBeInTheDocument();
      expect(screen.getByText('02:00')).toBeInTheDocument();
    });
  });

  it('toggles play/pause state', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    // Simulate audio loaded
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      fireEvent.canPlay(audioElement);
    }

    await waitFor(() => {
      const playButton = screen.getByText('Play');
      fireEvent.click(playButton);
    });

    expect(mockAudio.play).toHaveBeenCalled();
    expect(mockProps.onPlayStateChange).toHaveBeenCalledWith(true);
  });

  it('handles audio time updates', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      
      // Simulate time update
      mockAudio.currentTime = 30;
      fireEvent.timeUpdate(audioElement);
    }

    expect(mockProps.onTimeUpdate).toHaveBeenCalledWith(30, 120);
  });

  it('handles audio ended event', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      fireEvent.ended(audioElement);
    }

    expect(mockProps.onEnded).toHaveBeenCalled();
  });

  it('shows download button when audioBlob is provided', () => {
    render(<AudioPlayer {...mockProps} showDownload={true} />);
    
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('hides download button when showDownload is false', () => {
    render(<AudioPlayer {...mockProps} showDownload={false} />);
    
    expect(screen.queryByText('Download')).not.toBeInTheDocument();
  });

  it('handles download functionality', () => {
    // Mock document.createElement and appendChild/removeChild
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn()
    };
    
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        return mockAnchor as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    render(<AudioPlayer {...mockProps} showDownload={true} />);
    
    const downloadButton = screen.getByText('Download');
    fireEvent.click(downloadButton);

    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();

    // Restore original methods
    document.createElement = originalCreateElement;
  });

  it('handles playback rate changes', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      fireEvent.canPlay(audioElement);
    }

    await waitFor(() => {
      const speedButton = screen.getByText('1.5x');
      fireEvent.click(speedButton);
    });

    expect(mockAudio.playbackRate).toBe(1.5);
  });

  it('shows active speed button', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      fireEvent.canPlay(audioElement);
    }

    await waitFor(() => {
      const speedButton = screen.getByText('1x');
      expect(speedButton).toHaveClass('audio-player-speed-btn--active');
    });
  });

  it('handles seek functionality', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      fireEvent.canPlay(audioElement);
    }

    await waitFor(() => {
      const progressSlider = screen.getByRole('slider');
      fireEvent.change(progressSlider, { target: { value: '60' } });
    });

    expect(mockAudio.currentTime).toBe(60);
  });

  it('displays error message on audio error', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.error(audioElement);
    }

    await waitFor(() => {
      expect(screen.getByText('Failed to load audio file')).toBeInTheDocument();
    });
  });

  it('shows waveform placeholder when enabled', async () => {
    render(<AudioPlayer {...mockProps} showWaveform={true} />);
    
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      fireEvent.canPlay(audioElement);
    }

    await waitFor(() => {
      expect(screen.getByText('🎵 Waveform visualization would appear here')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    render(<AudioPlayer {...mockProps} className="custom-player" />);
    
    const player = document.querySelector('.audio-player.custom-player');
    expect(player).toBeInTheDocument();
  });

  it('handles audio play error gracefully', async () => {
    mockAudio.play.mockRejectedValue(new Error('Play failed'));
    
    render(<AudioPlayer {...mockProps} />);
    
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      fireEvent.canPlay(audioElement);
    }

    await waitFor(() => {
      const playButton = screen.getByText('Play');
      fireEvent.click(playButton);
    });

    // Should handle the error gracefully without crashing
    expect(mockAudio.play).toHaveBeenCalled();
  });

  it('updates progress bar style based on current time', async () => {
    render(<AudioPlayer {...mockProps} />);
    
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      fireEvent.loadedMetadata(audioElement);
      fireEvent.canPlay(audioElement);
      
      // Simulate 25% progress
      mockAudio.currentTime = 30;
      mockAudio.duration = 120;
      fireEvent.timeUpdate(audioElement);
    }

    await waitFor(() => {
      const progressSlider = screen.getByRole('slider');
      expect(progressSlider).toHaveValue('30');
    });
  });
});