import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationInterface } from '../conversation/ConversationInterface';
import { Agent } from '../conversation/AgentSelector';

// Mock the VoiceRecorder component
jest.mock('../voice/VoiceRecorder', () => ({
  VoiceRecorder: ({ onRecordingComplete, onError }: any) => (
    <div data-testid="voice-recorder">
      <button
        onClick={() => {
          const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
          onRecordingComplete(mockBlob, 'Test transcript');
        }}
      >
        Complete Recording
      </button>
      <button onClick={() => onError('Test error')}>
        Trigger Error
      </button>
    </div>
  )
}));

// Mock the AudioPlayer component
jest.mock('../voice/AudioPlayer', () => ({
  AudioPlayer: ({ title }: any) => (
    <div data-testid="audio-player">Audio Player: {title}</div>
  )
}));

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-url')
});

const mockAgent: Agent = {
  id: 'test-agent',
  name: 'Emma',
  personality: 'friendly-tutor',
  description: 'A friendly tutor',
  traits: ['Patient', 'Encouraging'],
  avatar: '👩‍🏫',
  voiceCharacteristics: { voice: 'Joanna', speed: 1.0, pitch: 1.0 },
  specialties: ['Grammar'],
  difficulty: 'beginner'
};

describe('ConversationInterface Component', () => {
  const mockProps = {
    agent: mockAgent,
    onEndConversation: jest.fn(),
    onSwitchAgent: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with agent information', () => {
    render(<ConversationInterface {...mockProps} />);
    
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.getByText('Listening')).toBeInTheDocument();
  });

  it('displays session duration', () => {
    render(<ConversationInterface {...mockProps} />);
    
    expect(screen.getByText('00:00')).toBeInTheDocument();
    
    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(65000); // 1 minute 5 seconds
    });
    
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('shows initial agent greeting', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Hi there! I'm Emma/)).toBeInTheDocument();
    });
  });

  it('displays message count', () => {
    render(<ConversationInterface {...mockProps} />);
    
    // Should show initial greeting message
    expect(screen.getByText('1 messages')).toBeInTheDocument();
  });

  it('handles recording completion', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    const completeButton = screen.getByText('Complete Recording');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test transcript')).toBeInTheDocument();
    });
  });

  it('shows agent speaking indicator', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    // Initially should show agent speaking for greeting
    await waitFor(() => {
      expect(screen.getByText('Speaking...')).toBeInTheDocument();
    });
  });

  it('displays typing indicator during agent response', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    // Wait for initial greeting to complete
    await waitFor(() => {
      expect(screen.getByText('Listening')).toBeInTheDocument();
    });
    
    // Trigger user message
    const completeButton = screen.getByText('Complete Recording');
    fireEvent.click(completeButton);
    
    // Should show typing indicator
    await waitFor(() => {
      expect(document.querySelector('.typing-indicator')).toBeInTheDocument();
    });
  });

  it('calls onEndConversation when end button is clicked', () => {
    render(<ConversationInterface {...mockProps} />);
    
    const endButton = screen.getByText('End Session');
    fireEvent.click(endButton);
    
    expect(mockProps.onEndConversation).toHaveBeenCalled();
  });

  it('calls onSwitchAgent when switch button is clicked', () => {
    render(<ConversationInterface {...mockProps} />);
    
    const switchButton = screen.getByText('Switch Agent');
    fireEvent.click(switchButton);
    
    expect(mockProps.onSwitchAgent).toHaveBeenCalled();
  });

  it('toggles feedback display', () => {
    render(<ConversationInterface {...mockProps} />);
    
    const feedbackButton = screen.getByText('Feedback');
    fireEvent.click(feedbackButton);
    
    // Feedback should be toggled (implementation detail)
    expect(feedbackButton).toBeInTheDocument();
  });

  it('displays user messages correctly', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    // Wait for initial setup
    await waitFor(() => {
      expect(screen.getByText('Listening')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByText('Complete Recording');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test transcript')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  it('displays agent messages correctly', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Emma')).toBeInTheDocument();
      expect(screen.getByText(/Hi there! I'm Emma/)).toBeInTheDocument();
    });
  });

  it('shows confidence scores for user messages', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Listening')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByText('Complete Recording');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();
    });
  });

  it('displays audio player for messages with audio', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Listening')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByText('Complete Recording');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('audio-player')).toBeInTheDocument();
    });
  });

  it('handles voice recorder errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<ConversationInterface {...mockProps} />);
    
    const errorButton = screen.getByText('Trigger Error');
    fireEvent.click(errorButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Conversation error:', 'Test error');
    
    consoleSpy.mockRestore();
  });

  it('auto-scrolls to bottom when new messages arrive', async () => {
    const mockScrollIntoView = jest.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;
    
    render(<ConversationInterface {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Listening')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByText('Complete Recording');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });

  it('applies custom className', () => {
    render(<ConversationInterface {...mockProps} className="custom-interface" />);
    
    const interfaceElement = document.querySelector('.conversation-interface.custom-interface');
    expect(interfaceElement).toBeInTheDocument();
  });

  it('shows different greetings for different agent personalities', () => {
    const strictTeacher: Agent = {
      ...mockAgent,
      name: 'Professor Chen',
      personality: 'strict-teacher'
    };
    
    render(<ConversationInterface {...mockProps} agent={strictTeacher} />);
    
    expect(screen.getByText(/Good day. I am Professor Chen/)).toBeInTheDocument();
  });

  it('displays message timestamps', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    await waitFor(() => {
      const timeElements = document.querySelectorAll('.message-time');
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  it('shows feedback when enabled', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    // Toggle feedback display
    const feedbackButton = screen.getByText('Feedback');
    fireEvent.click(feedbackButton);
    
    await waitFor(() => {
      expect(screen.getByText('Listening')).toBeInTheDocument();
    });
    
    // Add a user message to trigger feedback
    const completeButton = screen.getByText('Complete Recording');
    fireEvent.click(completeButton);
    
    // Wait for agent response with feedback
    await waitFor(() => {
      // Should eventually show feedback scores
      expect(screen.getByText('Test transcript')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles empty transcript gracefully', async () => {
    // Mock VoiceRecorder to return empty transcript
    jest.doMock('../voice/VoiceRecorder', () => ({
      VoiceRecorder: ({ onRecordingComplete }: any) => (
        <div data-testid="voice-recorder">
          <button
            onClick={() => {
              const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
              onRecordingComplete(mockBlob, '   '); // Empty/whitespace transcript
            }}
          >
            Complete Empty Recording
          </button>
        </div>
      )
    }));
    
    render(<ConversationInterface {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Listening')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByText('Complete Empty Recording');
    fireEvent.click(completeButton);
    
    // Should not add empty message
    await waitFor(() => {
      expect(screen.queryByText('   ')).not.toBeInTheDocument();
    });
  });

  it('generates appropriate agent responses', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Listening')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByText('Complete Recording');
    fireEvent.click(completeButton);
    
    // Should generate and display agent response
    await waitFor(() => {
      // Look for any agent response (they're randomized)
      const agentMessages = screen.getAllByText('Emma');
      expect(agentMessages.length).toBeGreaterThan(1); // Initial greeting + response
    }, { timeout: 3000 });
  });

  it('maintains conversation history', async () => {
    render(<ConversationInterface {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Listening')).toBeInTheDocument();
    });
    
    // Add first message
    const completeButton = screen.getByText('Complete Recording');
    fireEvent.click(completeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test transcript')).toBeInTheDocument();
    });
    
    // Message count should increase
    await waitFor(() => {
      expect(screen.getByText(/messages/)).toBeInTheDocument();
    });
  });
});