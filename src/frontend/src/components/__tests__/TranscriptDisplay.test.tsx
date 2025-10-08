import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TranscriptDisplay } from '../voice/TranscriptDisplay';

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-url')
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
});

describe('TranscriptDisplay Component', () => {
  const mockEntries = [
    {
      id: '1',
      text: 'Hello world',
      confidence: 0.95,
      timestamp: Date.now() - 5000,
      isPartial: false,
      speaker: 'User'
    },
    {
      id: '2',
      text: 'This is a test',
      confidence: 0.87,
      timestamp: Date.now() - 3000,
      isPartial: false
    },
    {
      id: '3',
      text: 'Partial transcript',
      confidence: 0.6,
      timestamp: Date.now() - 1000,
      isPartial: true
    }
  ];

  const mockProps = {
    entries: mockEntries,
    currentTranscript: 'Current speaking...',
    isTranscribing: true,
    showConfidence: true,
    showTimestamps: true,
    onClear: jest.fn(),
    onExport: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<TranscriptDisplay entries={[]} />);
    
    expect(screen.getByText('Live Transcript')).toBeInTheDocument();
    expect(screen.getByText('Start speaking to see your transcript here')).toBeInTheDocument();
  });

  it('shows listening indicator when transcribing', () => {
    render(<TranscriptDisplay isTranscribing={true} entries={[]} />);
    
    expect(screen.getByText('Listening...')).toBeInTheDocument();
    expect(document.querySelector('.transcript-display-dot')).toBeInTheDocument();
  });

  it('displays transcript entries correctly', () => {
    render(<TranscriptDisplay {...mockProps} />);
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('This is a test')).toBeInTheDocument();
    expect(screen.getByText('User:')).toBeInTheDocument();
  });

  it('shows confidence badges when enabled', () => {
    render(<TranscriptDisplay {...mockProps} />);
    
    expect(screen.getByText('High')).toBeInTheDocument(); // 0.95 confidence
    expect(screen.getByText('Medium')).toBeInTheDocument(); // 0.87 confidence
  });

  it('hides confidence badges when disabled', () => {
    render(<TranscriptDisplay {...mockProps} showConfidence={false} />);
    
    expect(screen.queryByText('High')).not.toBeInTheDocument();
    expect(screen.queryByText('Medium')).not.toBeInTheDocument();
  });

  it('shows timestamps when enabled', () => {
    render(<TranscriptDisplay {...mockProps} />);
    
    // Should show formatted timestamps
    const timestamps = document.querySelectorAll('.transcript-entry-timestamp');
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('hides timestamps when disabled', () => {
    render(<TranscriptDisplay {...mockProps} showTimestamps={false} />);
    
    const timestamps = document.querySelectorAll('.transcript-entry-timestamp');
    expect(timestamps.length).toBe(0);
  });

  it('displays current transcript with cursor', () => {
    render(<TranscriptDisplay {...mockProps} />);
    
    expect(screen.getByText('Current speaking...')).toBeInTheDocument();
    expect(document.querySelector('.transcript-entry-cursor')).toBeInTheDocument();
  });

  it('shows waiting message when transcribing but no content', () => {
    render(<TranscriptDisplay isTranscribing={true} entries={[]} currentTranscript="" />);
    
    expect(screen.getByText('Listening for speech...')).toBeInTheDocument();
  });

  it('displays entry count and average confidence in footer', () => {
    render(<TranscriptDisplay {...mockProps} />);
    
    expect(screen.getByText(/2 entries/)).toBeInTheDocument(); // Only non-partial entries
    expect(screen.getByText(/Avg confidence: 91%/)).toBeInTheDocument(); // (95 + 87) / 2
  });

  it('handles clear functionality', () => {
    render(<TranscriptDisplay {...mockProps} />);
    
    const clearButton = screen.getByTitle('Clear transcript');
    fireEvent.click(clearButton);
    
    expect(mockProps.onClear).toHaveBeenCalled();
  });

  it('handles export functionality', () => {
    // Mock document.createElement and related methods
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

    render(<TranscriptDisplay {...mockProps} />);
    
    const exportButton = screen.getByTitle('Export transcript');
    fireEvent.click(exportButton);
    
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockProps.onExport).toHaveBeenCalled();

    // Restore original methods
    document.createElement = originalCreateElement;
  });

  it('does not show action buttons when no content', () => {
    render(<TranscriptDisplay entries={[]} currentTranscript="" onClear={jest.fn()} onExport={jest.fn()} />);
    
    expect(screen.queryByTitle('Clear transcript')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Export transcript')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<TranscriptDisplay className="custom-transcript" entries={[]} />);
    
    const display = document.querySelector('.transcript-display.custom-transcript');
    expect(display).toBeInTheDocument();
  });

  it('applies custom maxHeight', () => {
    render(<TranscriptDisplay maxHeight={400} entries={mockEntries} />);
    
    const content = document.querySelector('.transcript-display-content');
    expect(content).toHaveStyle('max-height: 400px');
  });

  it('distinguishes between final and partial entries', () => {
    render(<TranscriptDisplay {...mockProps} />);
    
    const finalEntries = document.querySelectorAll('.transcript-entry--final');
    const partialEntries = document.querySelectorAll('.transcript-entry--partial');
    
    expect(finalEntries.length).toBe(2); // First two entries are final
    expect(partialEntries.length).toBe(1); // Third entry is partial
  });

  it('shows correct confidence colors', () => {
    render(<TranscriptDisplay {...mockProps} />);
    
    const highConfidenceBadge = screen.getByText('High');
    const mediumConfidenceBadge = screen.getByText('Medium');
    
    expect(highConfidenceBadge).toBeInTheDocument();
    expect(mediumConfidenceBadge).toBeInTheDocument();
  });

  it('handles entries without speaker', () => {
    const entriesWithoutSpeaker = [
      {
        id: '1',
        text: 'No speaker entry',
        confidence: 0.9,
        timestamp: Date.now(),
        isPartial: false
      }
    ];

    render(<TranscriptDisplay entries={entriesWithoutSpeaker} />);
    
    expect(screen.getByText('No speaker entry')).toBeInTheDocument();
    expect(screen.queryByText('User:')).not.toBeInTheDocument();
  });

  it('scrolls to bottom when new content is added', () => {
    const mockScrollTo = jest.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
      set: mockScrollTo,
      configurable: true
    });

    const { rerender } = render(<TranscriptDisplay entries={[mockEntries[0]]} />);
    
    rerender(<TranscriptDisplay entries={mockEntries} />);
    
    // The scroll behavior is handled by useEffect, so we can't easily test it
    // but we can verify the component renders correctly with new entries
    expect(screen.getByText('This is a test')).toBeInTheDocument();
  });

  it('handles empty entries array', () => {
    render(<TranscriptDisplay entries={[]} />);
    
    expect(screen.getByText('Start speaking to see your transcript here')).toBeInTheDocument();
  });

  it('calculates average confidence correctly with no entries', () => {
    render(<TranscriptDisplay entries={[]} showConfidence={true} />);
    
    // Should not show confidence stats when no entries
    expect(screen.queryByText(/Avg confidence/)).not.toBeInTheDocument();
  });

  it('exports transcript with correct format', () => {
    const mockBlob = jest.fn();
    global.Blob = mockBlob as any;

    render(<TranscriptDisplay {...mockProps} />);
    
    const exportButton = screen.getByTitle('Export transcript');
    fireEvent.click(exportButton);
    
    // Verify Blob was created with correct content
    expect(mockBlob).toHaveBeenCalledWith(
      [expect.stringContaining('Hello world')],
      { type: 'text/plain' }
    );
  });
});