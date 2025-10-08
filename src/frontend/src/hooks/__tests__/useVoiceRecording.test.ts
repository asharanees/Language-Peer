import { renderHook, act } from '@testing-library/react';
import { useVoiceRecording } from '../useVoiceRecording';

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  ondataavailable: null as any,
  onstop: null as any,
  onerror: null as any,
  state: 'inactive'
};

const mockMediaStream = {
  getTracks: jest.fn(() => [
    { stop: jest.fn() }
  ])
};

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => Promise.resolve(mockMediaStream))
  }
});

// Mock MediaRecorder constructor
global.MediaRecorder = jest.fn(() => mockMediaRecorder) as any;
MediaRecorder.isTypeSupported = jest.fn(() => true);

// Mock URL methods
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-url')
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
});

describe('useVoiceRecording Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useVoiceRecording());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.duration).toBe(0);
    expect(result.current.audioBlob).toBe(null);
    expect(result.current.audioUrl).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.isSupported).toBe(true);
  });

  it('detects unsupported browser', () => {
    // Mock unsupported browser
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
    delete (navigator as any).mediaDevices;

    const { result } = renderHook(() => useVoiceRecording());

    expect(result.current.isSupported).toBe(false);

    // Restore
    if (originalGetUserMedia) {
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: { getUserMedia: originalGetUserMedia }
      });
    }
  });

  it('starts recording successfully', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    });
    expect(MediaRecorder).toHaveBeenCalledWith(mockMediaStream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    expect(mockMediaRecorder.start).toHaveBeenCalledWith(100);
    expect(result.current.isRecording).toBe(true);
  });

  it('handles getUserMedia error', async () => {
    const error = new Error('Permission denied');
    (navigator.mediaDevices.getUserMedia as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).toBe('Permission denied');
    expect(result.current.isRecording).toBe(false);
  });

  it('stops recording and creates audio blob', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate recording stop
    act(() => {
      result.current.stopRecording();
    });

    expect(mockMediaRecorder.stop).toHaveBeenCalled();

    // Simulate MediaRecorder onstop event
    const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
    act(() => {
      if (mockMediaRecorder.onstop) {
        // Simulate data available event first
        if (mockMediaRecorder.ondataavailable) {
          mockMediaRecorder.ondataavailable({ data: mockBlob });
        }
        mockMediaRecorder.onstop();
      }
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.audioBlob).toEqual(expect.any(Blob));
    expect(result.current.audioUrl).toBe('blob:mock-url');
  });

  it('pauses and resumes recording', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.pauseRecording();
    });

    expect(mockMediaRecorder.pause).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.resumeRecording();
    });

    expect(mockMediaRecorder.resume).toHaveBeenCalled();
    expect(result.current.isPaused).toBe(false);
  });

  it('clears recording data', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    // Set up some recording data
    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.stopRecording();
    });

    // Simulate recording completion
    act(() => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    act(() => {
      result.current.clearRecording();
    });

    expect(result.current.audioBlob).toBe(null);
    expect(result.current.audioUrl).toBe(null);
    expect(result.current.duration).toBe(0);
    expect(result.current.error).toBe(null);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('updates duration during recording', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(2000); // 2 seconds
    });

    expect(result.current.duration).toBeGreaterThan(0);
  });

  it('handles MediaRecorder error', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate MediaRecorder error
    const error = { message: 'Recording failed' };
    act(() => {
      if (mockMediaRecorder.onerror) {
        mockMediaRecorder.onerror({ error });
      }
    });

    expect(result.current.error).toBe('Recording error: Recording failed');
    expect(result.current.isRecording).toBe(false);
  });

  it('prevents starting recording when unsupported', async () => {
    // Mock unsupported browser
    const originalGetUserMedia = navigator.mediaDevices?.getUserMedia;
    delete (navigator as any).mediaDevices;

    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).toBe('Audio recording is not supported in this browser');
    expect(result.current.isRecording).toBe(false);

    // Restore
    if (originalGetUserMedia) {
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: { getUserMedia: originalGetUserMedia }
      });
    }
  });

  it('uses fallback MIME type when opus not supported', async () => {
    MediaRecorder.isTypeSupported = jest.fn((type) => type !== 'audio/webm;codecs=opus');

    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(MediaRecorder).toHaveBeenCalledWith(mockMediaStream, {
      mimeType: 'audio/webm'
    });
  });

  it('cleans up resources on unmount', async () => {
    const { result, unmount } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    // Set up audio URL
    act(() => {
      result.current.stopRecording();
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    unmount();

    expect(mockMediaStream.getTracks()[0].stop).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('handles data available events', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate data available events
    const chunk1 = new Blob(['chunk1'], { type: 'audio/webm' });
    const chunk2 = new Blob(['chunk2'], { type: 'audio/webm' });

    act(() => {
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ data: chunk1 });
        mockMediaRecorder.ondataavailable({ data: chunk2 });
      }
    });

    act(() => {
      result.current.stopRecording();
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    expect(result.current.audioBlob).toEqual(expect.any(Blob));
  });

  it('does not pause when not recording', () => {
    const { result } = renderHook(() => useVoiceRecording());

    act(() => {
      result.current.pauseRecording();
    });

    expect(mockMediaRecorder.pause).not.toHaveBeenCalled();
  });

  it('does not resume when not paused', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    act(() => {
      result.current.resumeRecording();
    });

    expect(mockMediaRecorder.resume).not.toHaveBeenCalled();
  });
});