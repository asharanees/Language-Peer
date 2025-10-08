import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VoiceRecorder } from '../voice/VoiceRecorder';

// Mock the hooks
jest.mock('../../hooks/useVoiceRecording', () => ({
  useVoiceRecording: () => ({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    isSupported: true,
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    clearRecording: jest.fn()
  })
}));

jest.mock('../../hooks/useVoiceTranscription', () => ({
  useVoiceTranscription: () => ({
    isTranscribing: false,
    currentTranscript: '',
    finalTranscript: '',
    confidence: 0,
    error: null,
    startTranscription: jest.fn(),
    stopTranscription: jest.fn(),
    clearTranscription: jest.fn()
  })
}));

describe('VoiceRecorder Component', () => {
  const mockProps = {
    onRecordingComplete: jest.fn(),
    onTranscriptUpdate: jest.fn(),
    onError: jest.fn(),
    maxDuration: 60,
    autoTranscribe: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default state', () => {
    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('Ready to Record')).toBeInTheDocument();
    expect(screen.getByText('Start Recording')).toBeInTheDocument();
  });

  it('shows recording status when active', () => {
    const mockUseVoiceRecording = require('../../hooks/useVoiceRecording').useVoiceRecording;
    mockUseVoiceRecording.mockReturnValue({
      isRecording: true,
      isPaused: false,
      duration: 15,
      audioBlob: null,
      audioUrl: null,
      error: null,
      isSupported: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      clearRecording: jest.fn()
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('Recording...')).toBeInTheDocument();
    expect(screen.getByText('00:15 / 01:00')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });

  it('shows paused state correctly', () => {
    const mockUseVoiceRecording = require('../../hooks/useVoiceRecording').useVoiceRecording;
    mockUseVoiceRecording.mockReturnValue({
      isRecording: true,
      isPaused: true,
      duration: 30,
      audioBlob: null,
      audioUrl: null,
      error: null,
      isSupported: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      clearRecording: jest.fn()
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });

  it('shows completed recording state', () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
    const mockUseVoiceRecording = require('../../hooks/useVoiceRecording').useVoiceRecording;
    mockUseVoiceRecording.mockReturnValue({
      isRecording: false,
      isPaused: false,
      duration: 45,
      audioBlob: mockBlob,
      audioUrl: 'blob:audio-url',
      error: null,
      isSupported: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      clearRecording: jest.fn()
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('Recording Complete')).toBeInTheDocument();
    expect(screen.getByText('Record Again')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('displays transcription when available', () => {
    const mockUseVoiceTranscription = require('../../hooks/useVoiceTranscription').useVoiceTranscription;
    mockUseVoiceTranscription.mockReturnValue({
      isTranscribing: true,
      currentTranscript: 'Hello world',
      finalTranscript: 'This is a test.',
      confidence: 0.95,
      error: null,
      startTranscription: jest.fn(),
      stopTranscription: jest.fn(),
      clearTranscription: jest.fn()
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('Live Transcription')).toBeInTheDocument();
    expect(screen.getByText('This is a test.')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Confidence: 95%')).toBeInTheDocument();
  });

  it('handles unsupported browser gracefully', () => {
    const mockUseVoiceRecording = require('../../hooks/useVoiceRecording').useVoiceRecording;
    mockUseVoiceRecording.mockReturnValue({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
      isSupported: false,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      clearRecording: jest.fn()
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('Voice recording is not supported in this browser.')).toBeInTheDocument();
    expect(screen.getByText('Please use a modern browser like Chrome, Firefox, or Safari.')).toBeInTheDocument();
  });

  it('displays errors correctly', () => {
    const mockUseVoiceRecording = require('../../hooks/useVoiceRecording').useVoiceRecording;
    mockUseVoiceRecording.mockReturnValue({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: 'Microphone access denied',
      isSupported: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      clearRecording: jest.fn()
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const mockUseVoiceRecording = require('../../hooks/useVoiceRecording').useVoiceRecording;
    mockUseVoiceRecording.mockReturnValue({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: 'Recording failed',
      isSupported: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      clearRecording: jest.fn()
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(mockProps.onError).toHaveBeenCalledWith('Recording failed');
  });

  it('calls onTranscriptUpdate when transcript changes', () => {
    const mockUseVoiceTranscription = require('../../hooks/useVoiceTranscription').useVoiceTranscription;
    mockUseVoiceTranscription.mockReturnValue({
      isTranscribing: true,
      currentTranscript: 'current',
      finalTranscript: 'final',
      confidence: 0.8,
      error: null,
      startTranscription: jest.fn(),
      stopTranscription: jest.fn(),
      clearTranscription: jest.fn()
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(mockProps.onTranscriptUpdate).toHaveBeenCalledWith('finalcurrent', true);
  });

  it('calls onRecordingComplete when recording finishes', () => {
    const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
    const mockUseVoiceRecording = require('../../hooks/useVoiceRecording').useVoiceRecording;
    mockUseVoiceRecording.mockReturnValue({
      isRecording: false,
      isPaused: false,
      duration: 30,
      audioBlob: mockBlob,
      audioUrl: 'blob:audio-url',
      error: null,
      isSupported: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      clearRecording: jest.fn()
    });

    const mockUseVoiceTranscription = require('../../hooks/useVoiceTranscription').useVoiceTranscription;
    mockUseVoiceTranscription.mockReturnValue({
      isTranscribing: false,
      currentTranscript: '',
      finalTranscript: 'Test transcript',
      confidence: 0.9,
      error: null,
      startTranscription: jest.fn(),
      stopTranscription: jest.fn(),
      clearTranscription: jest.fn()
    });

    render(<VoiceRecorder {...mockProps} />);
    
    expect(mockProps.onRecordingComplete).toHaveBeenCalledWith(mockBlob, 'Test transcript');
  });

  it('shows progress bar during recording', () => {
    const mockUseVoiceRecording = require('../../hooks/useVoiceRecording').useVoiceRecording;
    mockUseVoiceRecording.mockReturnValue({
      isRecording: true,
      isPaused: false,
      duration: 30,
      audioBlob: null,
      audioUrl: null,
      error: null,
      isSupported: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      pauseRecording: jest.fn(),
      resumeRecording: jest.fn(),
      clearRecording: jest.fn()
    });

    render(<VoiceRecorder maxDuration={60} />);
    
    const progressBar = document.querySelector('.voice-recorder-progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle('width: 50%'); // 30/60 * 100
  });

  it('applies custom className', () => {
    render(<VoiceRecorder className="custom-recorder" />);
    
    const recorder = document.querySelector('.voice-recorder.custom-recorder');
    expect(recorder).toBeInTheDocument();
  });

  it('handles button clicks correctly', async () => {
    const mockStartRecording = jest.fn();
    const mockStopRecording = jest.fn();
    const mockPauseRecording = jest.fn();
    const mockResumeRecording = jest.fn();
    const mockClearRecording = jest.fn();

    const mockUseVoiceRecording = require('../../hooks/useVoiceRecording').useVoiceRecording;
    mockUseVoiceRecording.mockReturnValue({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
      isSupported: true,
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      pauseRecording: mockPauseRecording,
      resumeRecording: mockResumeRecording,
      clearRecording: mockClearRecording
    });

    render(<VoiceRecorder />);
    
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    expect(mockStartRecording).toHaveBeenCalled();
  });
});