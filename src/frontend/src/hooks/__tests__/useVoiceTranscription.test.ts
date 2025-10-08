import { renderHook, act } from '@testing-library/react';
import { useVoiceTranscription } from '../useVoiceTranscription';

// Mock SpeechRecognition
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  lang: '',
  maxAlternatives: 1,
  start: jest.fn(),
  stop: jest.fn(),
  onstart: null as any,
  onresult: null as any,
  onerror: null as any,
  onend: null as any
};

// Mock window.SpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn(() => mockSpeechRecognition)
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: jest.fn(() => mockSpeechRecognition)
});

describe('useVoiceTranscription Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useVoiceTranscription());

    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.currentTranscript).toBe('');
    expect(result.current.finalTranscript).toBe('');
    expect(result.current.confidence).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.isConnected).toBe(false);
  });

  it('starts transcription successfully', async () => {
    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    expect(window.SpeechRecognition).toHaveBeenCalled();
    expect(mockSpeechRecognition.start).toHaveBeenCalled();
    expect(mockSpeechRecognition.continuous).toBe(true);
    expect(mockSpeechRecognition.interimResults).toBe(true);
    expect(mockSpeechRecognition.lang).toBe('en-US');
    expect(mockSpeechRecognition.maxAlternatives).toBe(1);
  });

  it('handles speech recognition start event', async () => {
    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    // Simulate onstart event
    act(() => {
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }
    });

    expect(result.current.isTranscribing).toBe(true);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.currentTranscript).toBe('');
    expect(result.current.finalTranscript).toBe('');
  });

  it('handles speech recognition results', async () => {
    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    // Mock speech recognition result event
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'Hello world', confidence: 0.95 },
          isFinal: true
        },
        {
          0: { transcript: ' this is', confidence: 0.8 },
          isFinal: false
        }
      ],
      length: 2
    };

    act(() => {
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }
    });

    expect(result.current.finalTranscript).toBe('Hello world');
    expect(result.current.currentTranscript).toBe(' this is');
    expect(result.current.confidence).toBe(0.8); // Last processed confidence
  });

  it('handles multiple final results', async () => {
    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    // First result
    const mockEvent1 = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'Hello', confidence: 0.9 },
          isFinal: true
        }
      ],
      length: 1
    };

    act(() => {
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent1);
      }
    });

    // Second result
    const mockEvent2 = {
      resultIndex: 1,
      results: [
        {
          0: { transcript: 'Hello', confidence: 0.9 },
          isFinal: true
        },
        {
          0: { transcript: ' world', confidence: 0.85 },
          isFinal: true
        }
      ],
      length: 2
    };

    act(() => {
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent2);
      }
    });

    expect(result.current.finalTranscript).toBe('Hello world');
  });

  it('handles speech recognition errors', async () => {
    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    // Test different error types
    const errorTypes = [
      { error: 'no-speech', expectedMessage: 'No speech detected. Please try speaking again.' },
      { error: 'audio-capture', expectedMessage: 'Audio capture failed. Please check your microphone.' },
      { error: 'not-allowed', expectedMessage: 'Microphone access denied. Please allow microphone access.' },
      { error: 'network', expectedMessage: 'Network error occurred during transcription.' },
      { error: 'unknown', expectedMessage: 'Speech recognition error: unknown' }
    ];

    for (const { error, expectedMessage } of errorTypes) {
      act(() => {
        if (mockSpeechRecognition.onerror) {
          mockSpeechRecognition.onerror({ error });
        }
      });

      expect(result.current.error).toBe(expectedMessage);
      expect(result.current.isTranscribing).toBe(false);
      expect(result.current.isConnected).toBe(false);
    }
  });

  it('handles speech recognition end event', async () => {
    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    // Simulate onstart first
    act(() => {
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }
    });

    // Then simulate onend
    act(() => {
      if (mockSpeechRecognition.onend) {
        mockSpeechRecognition.onend();
      }
    });

    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.currentTranscript).toBe('');
  });

  it('stops transcription', async () => {
    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    act(() => {
      result.current.stopTranscription();
    });

    expect(mockSpeechRecognition.stop).toHaveBeenCalled();
  });

  it('clears transcription data', () => {
    const { result } = renderHook(() => useVoiceTranscription());

    // Set some data first
    act(() => {
      result.current.clearTranscription();
    });

    expect(result.current.currentTranscript).toBe('');
    expect(result.current.finalTranscript).toBe('');
    expect(result.current.confidence).toBe(0);
    expect(result.current.error).toBe(null);
  });

  it('handles unsupported browser', async () => {
    // Mock unsupported browser
    const originalSpeechRecognition = window.SpeechRecognition;
    const originalWebkitSpeechRecognition = (window as any).webkitSpeechRecognition;
    
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    expect(result.current.error).toBe('Speech recognition is not supported in this browser');

    // Restore
    window.SpeechRecognition = originalSpeechRecognition;
    (window as any).webkitSpeechRecognition = originalWebkitSpeechRecognition;
  });

  it('uses fallback confidence when not provided', async () => {
    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    // Mock result without confidence
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'Test', confidence: undefined },
          isFinal: true
        }
      ],
      length: 1
    };

    act(() => {
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }
    });

    expect(result.current.confidence).toBe(0.8); // Fallback confidence
  });

  it('cleans up on unmount', async () => {
    const { result, unmount } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    // Simulate recognition is running
    act(() => {
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart();
      }
    });

    unmount();

    expect(mockSpeechRecognition.stop).toHaveBeenCalled();
  });

  it('handles exception during start', async () => {
    mockSpeechRecognition.start.mockImplementation(() => {
      throw new Error('Start failed');
    });

    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    expect(result.current.error).toBe('Start failed');
    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.isConnected).toBe(false);
  });

  it('does not stop when not transcribing', () => {
    const { result } = renderHook(() => useVoiceTranscription());

    act(() => {
      result.current.stopTranscription();
    });

    expect(mockSpeechRecognition.stop).not.toHaveBeenCalled();
  });

  it('handles interim results correctly', async () => {
    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    // Mock interim result
    const mockEvent = {
      resultIndex: 0,
      results: [
        {
          0: { transcript: 'Hello', confidence: 0.7 },
          isFinal: false
        }
      ],
      length: 1
    };

    act(() => {
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockEvent);
      }
    });

    expect(result.current.currentTranscript).toBe('Hello');
    expect(result.current.finalTranscript).toBe('');
  });

  it('uses webkit speech recognition as fallback', async () => {
    // Remove standard SpeechRecognition
    const originalSpeechRecognition = window.SpeechRecognition;
    delete (window as any).SpeechRecognition;

    const { result } = renderHook(() => useVoiceTranscription());

    await act(async () => {
      await result.current.startTranscription();
    });

    expect((window as any).webkitSpeechRecognition).toHaveBeenCalled();

    // Restore
    window.SpeechRecognition = originalSpeechRecognition;
  });
});