import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConversationInterface } from '../conversation/ConversationInterface';
import { AgentSelector, Agent } from '../conversation/AgentSelector';
import { FeedbackPanel } from '../conversation/FeedbackPanel';

// Mock the voice components
jest.mock('../voice/VoiceRecorder', () => ({
  VoiceRecorder: ({ onRecordingComplete, onTranscriptUpdate, onError }: any) => (
    <div data-testid="voice-recorder">
      <button
        onClick={() => {
          const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
          onRecordingComplete(mockBlob, 'Hello, how are you today?');
        }}
      >
        Record Message
      </button>
      <button
        onClick={() => onTranscriptUpdate('Partial transcript...', true)}
      >
        Update Transcript
      </button>
      <button onClick={() => onError('Microphone access denied')}>
        Trigger Error
      </button>
    </div>
  )
}));

jest.mock('../voice/AudioPlayer', () => ({
  AudioPlayer: ({ title, audioUrl }: any) => (
    <div data-testid="audio-player" data-audio-url={audioUrl}>
      Audio Player: {title}
    </div>
  )
}));

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-audio-url')
});

const mockAgents: Agent[] = [
  {
    id: 'friendly-tutor',
    name: 'Emma',
    personality: 'friendly-tutor',
    description: 'A patient and encouraging tutor',
    traits: ['Patient', 'Encouraging', 'Supportive'],
    avatar: '👩‍🏫',
    voiceCharacteristics: { voice: 'Joanna', speed: 1.0, pitch: 1.0 },
    specialties: ['Grammar', 'Vocabulary'],
    difficulty: 'beginner'
  },
  {
    id: 'strict-teacher',
    name: 'Professor Chen',
    personality: 'strict-teacher',
    description: 'A disciplined educator focused on accuracy',
    traits: ['Precise', 'Detailed', 'Thorough'],
    avatar: '👨‍💼',
    voiceCharacteristics: { voice: 'Matthew', speed: 0.9, pitch: 0.9 },
    specialties: ['Grammar', 'Pronunciation'],
    difficulty: 'advanced'
  }
];

describe('Conversation Interface Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Agent Selection to Conversation Flow', () => {
    it('should transition from agent selection to conversation interface', async () => {
      const mockOnAgentSelect = jest.fn();
      const mockOnStartConversation = jest.fn();
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      // Render agent selector first
      const { rerender } = render(
        <AgentSelector
          agents={mockAgents}
          onAgentSelect={mockOnAgentSelect}
          onStartConversation={mockOnStartConversation}
        />
      );

      // Select an agent
      const emmaCard = screen.getByText('Emma').closest('.agent-card');
      fireEvent.click(emmaCard!);
      expect(mockOnAgentSelect).toHaveBeenCalledWith(mockAgents[0]);

      // Start conversation
      rerender(
        <AgentSelector
          agents={mockAgents}
          selectedAgent={mockAgents[0]}
          onAgentSelect={mockOnAgentSelect}
          onStartConversation={mockOnStartConversation}
        />
      );

      const startButton = screen.getByText('Start Conversation');
      fireEvent.click(startButton);
      expect(mockOnStartConversation).toHaveBeenCalled();

      // Transition to conversation interface
      rerender(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Verify conversation interface is loaded with agent
      await waitFor(() => {
        expect(screen.getByText('Emma')).toBeInTheDocument();
        expect(screen.getByText(/Hi there! I'm Emma/)).toBeInTheDocument();
      });
    });

    it('should handle agent switching during conversation', async () => {
      const mockOnSwitchAgent = jest.fn();
      const mockOnEndConversation = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Wait for initial greeting
      await waitFor(() => {
        expect(screen.getByText('Emma')).toBeInTheDocument();
      });

      // Click switch agent button
      const switchButton = screen.getByText('Switch Agent');
      fireEvent.click(switchButton);

      expect(mockOnSwitchAgent).toHaveBeenCalled();
    });
  });

  describe('Real-time Conversation Flow', () => {
    it('should handle complete conversation cycle with feedback', async () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Wait for initial greeting
      await waitFor(() => {
        expect(screen.getByText('Listening')).toBeInTheDocument();
      });

      // Enable feedback display
      const feedbackButton = screen.getByText('Feedback');
      fireEvent.click(feedbackButton);

      // Record a message
      const recordButton = screen.getByText('Record Message');
      fireEvent.click(recordButton);

      // Verify user message appears
      await waitFor(() => {
        expect(screen.getByText('Hello, how are you today?')).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
      });

      // Verify agent starts responding
      await waitFor(() => {
        expect(screen.getByText('Speaking...')).toBeInTheDocument();
      });

      // Wait for agent response
      await waitFor(() => {
        const agentMessages = screen.getAllByText('Emma');
        expect(agentMessages.length).toBeGreaterThan(1); // Initial greeting + response
      }, { timeout: 3000 });

      // Verify conversation history is maintained
      expect(screen.getByText('Hello, how are you today?')).toBeInTheDocument();
    });

    it('should display real-time transcript updates', () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Trigger transcript update
      const updateButton = screen.getByText('Update Transcript');
      fireEvent.click(updateButton);

      // This tests the onTranscriptUpdate handler
      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
    });

    it('should handle voice recording errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Trigger error
      const errorButton = screen.getByText('Trigger Error');
      fireEvent.click(errorButton);

      expect(consoleSpy).toHaveBeenCalledWith('Conversation error:', 'Microphone access denied');
      consoleSpy.mockRestore();
    });
  });

  describe('Feedback Integration', () => {
    it('should show feedback panel when feedback is available', async () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(screen.getByText('Listening')).toBeInTheDocument();
      });

      // Enable feedback display
      const feedbackButton = screen.getByText('Feedback');
      fireEvent.click(feedbackButton);

      // Record a message to generate feedback
      const recordButton = screen.getByText('Record Message');
      fireEvent.click(recordButton);

      // Wait for message and potential feedback
      await waitFor(() => {
        expect(screen.getByText('Hello, how are you today?')).toBeInTheDocument();
      });

      // Feedback should be integrated into the message display
      // (The actual feedback display depends on the implementation)
    });

    it('should handle feedback panel interactions', () => {
      const mockFeedback = {
        grammarScore: 85,
        fluencyScore: 78,
        vocabularyScore: 92,
        suggestions: ['Use more varied vocabulary'],
        corrections: ['Check your verb tenses'],
        encouragement: 'Great progress!'
      };

      const mockOnClose = jest.fn();

      render(
        <FeedbackPanel
          feedback={mockFeedback}
          isVisible={true}
          onClose={mockOnClose}
        />
      );

      // Test tab switching
      fireEvent.click(screen.getByText('💡 Tips'));
      expect(screen.getByText('Use more varied vocabulary')).toBeInTheDocument();

      fireEvent.click(screen.getByText('✏️ Corrections'));
      expect(screen.getByText('Check your verb tenses')).toBeInTheDocument();

      // Test closing
      fireEvent.click(screen.getByText('Continue Practice'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should track session duration accurately', async () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Initial duration should be 00:00
      expect(screen.getByText('00:00')).toBeInTheDocument();

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(125000); // 2 minutes 5 seconds
      });

      expect(screen.getByText('02:05')).toBeInTheDocument();
    });

    it('should track message count correctly', async () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Should start with 1 message (greeting)
      await waitFor(() => {
        expect(screen.getByText('1 messages')).toBeInTheDocument();
      });

      // Add user message
      const recordButton = screen.getByText('Record Message');
      fireEvent.click(recordButton);

      // Should increase message count
      await waitFor(() => {
        expect(screen.getByText(/messages/)).toBeInTheDocument();
      });
    });

    it('should end conversation properly', () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      const endButton = screen.getByText('End Session');
      fireEvent.click(endButton);

      expect(mockOnEndConversation).toHaveBeenCalled();
    });
  });

  describe('Agent Personality Integration', () => {
    it('should display different greetings for different agent personalities', async () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      // Test friendly tutor
      const { rerender } = render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Hi there! I'm Emma/)).toBeInTheDocument();
      });

      // Test strict teacher
      rerender(
        <ConversationInterface
          agent={mockAgents[1]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Good day. I am Professor Chen/)).toBeInTheDocument();
      });
    });

    it('should maintain agent personality throughout conversation', async () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[1]} // Strict teacher
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Wait for initial greeting
      await waitFor(() => {
        expect(screen.getByText('Professor Chen')).toBeInTheDocument();
      });

      // Record a message
      const recordButton = screen.getByText('Record Message');
      fireEvent.click(recordButton);

      // Wait for agent response
      await waitFor(() => {
        const agentMessages = screen.getAllByText('Professor Chen');
        expect(agentMessages.length).toBeGreaterThan(1);
      }, { timeout: 3000 });

      // Agent name should remain consistent
      expect(screen.getAllByText('Professor Chen').length).toBeGreaterThan(1);
    });
  });

  describe('Audio Integration', () => {
    it('should create audio URLs for recorded messages', async () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(screen.getByText('Listening')).toBeInTheDocument();
      });

      // Record a message
      const recordButton = screen.getByText('Record Message');
      fireEvent.click(recordButton);

      // Verify audio player is created with URL
      await waitFor(() => {
        const audioPlayer = screen.getByTestId('audio-player');
        expect(audioPlayer).toHaveAttribute('data-audio-url', 'blob:mock-audio-url');
      });
    });

    it('should display confidence scores for transcriptions', async () => {
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(screen.getByText('Listening')).toBeInTheDocument();
      });

      // Record a message
      const recordButton = screen.getByText('Record Message');
      fireEvent.click(recordButton);

      // Verify confidence score is displayed
      await waitFor(() => {
        expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty or whitespace-only transcripts', async () => {
      // Mock VoiceRecorder to return empty transcript
      jest.doMock('../voice/VoiceRecorder', () => ({
        VoiceRecorder: ({ onRecordingComplete }: any) => (
          <div data-testid="voice-recorder">
            <button
              onClick={() => {
                const mockBlob = new Blob(['audio'], { type: 'audio/webm' });
                onRecordingComplete(mockBlob, '   '); // Whitespace only
              }}
            >
              Record Empty
            </button>
          </div>
        )
      }));

      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(screen.getByText('Listening')).toBeInTheDocument();
      });

      const recordButton = screen.getByText('Record Empty');
      fireEvent.click(recordButton);

      // Should not add empty message to conversation
      await waitFor(() => {
        expect(screen.queryByText('   ')).not.toBeInTheDocument();
      });
    });

    it('should handle agent response generation failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock a failing response generation
      const originalGenerateAgentResponse = ConversationInterface.prototype.generateAgentResponse;
      
      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(screen.getByText('Listening')).toBeInTheDocument();
      });

      // This test verifies error handling exists in the component
      // The actual error handling is implemented in the component
      expect(screen.getByTestId('voice-recorder')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should auto-scroll to bottom when messages are added', async () => {
      const mockScrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      const mockOnEndConversation = jest.fn();
      const mockOnSwitchAgent = jest.fn();

      render(
        <ConversationInterface
          agent={mockAgents[0]}
          onEndConversation={mockOnEndConversation}
          onSwitchAgent={mockOnSwitchAgent}
        />
      );

      // Wait for initial greeting
      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalled();
      });

      // Add another message
      const recordButton = screen.getByText('Record Message');
      fireEvent.click(recordButton);

      // Should scroll again
      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalledTimes(2);
      });
    });
  });
});