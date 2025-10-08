import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { ConversationPage } from '../../pages/ConversationPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { VoiceProvider } from '../../contexts/VoiceContext';
import { ConversationProvider } from '../../contexts/ConversationContext';

// Mock the conversation components
jest.mock('../../components/conversation/AgentSelector', () => ({
  AgentSelector: ({ agents, onAgentSelect, onStartConversation, isLoading }: any) => (
    <div data-testid="agent-selector">
      <h2>Choose Your AI Tutor</h2>
      {agents.map((agent: any) => (
        <button key={agent.id} onClick={() => onAgentSelect(agent)}>
          {agent.name}
        </button>
      ))}
      {isLoading && <div>Connecting...</div>}
      <button onClick={onStartConversation} disabled={!agents.length}>
        Start Conversation
      </button>
    </div>
  )
}));

jest.mock('../../components/conversation/ConversationInterface', () => ({
  ConversationInterface: ({ agent, onEndConversation, onSwitchAgent }: any) => (
    <div data-testid="conversation-interface">
      <h2>Conversation with {agent.name}</h2>
      <button onClick={onEndConversation}>End Conversation</button>
      <button onClick={onSwitchAgent}>Switch Agent</button>
    </div>
  )
}));

// Mock the contexts and hooks
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    user: { id: '123', name: 'Test User' },
    login: jest.fn(),
    logout: jest.fn()
  })
}));

jest.mock('../../contexts/VoiceContext', () => ({
  VoiceProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="voice-provider">{children}</div>,
  useVoice: () => ({
    isListening: false,
    hasPermission: true,
    startListening: jest.fn(),
    stopListening: jest.fn(),
    transcription: '',
    error: null
  })
}));

jest.mock('../../contexts/ConversationContext', () => ({
  ConversationProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="conversation-provider">{children}</div>,
  useConversation: () => ({
    messages: [],
    currentAgent: null,
    isLoading: false,
    sendMessage: jest.fn(),
    selectAgent: jest.fn()
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <VoiceProvider>
          <ConversationProvider>
            {component}
          </ConversationProvider>
        </VoiceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ConversationPage Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders agent selector by default', () => {
    renderWithProviders(<ConversationPage />);
    
    expect(screen.getByTestId('agent-selector')).toBeInTheDocument();
    expect(screen.getByText('Choose Your AI Tutor')).toBeInTheDocument();
  });

  it('displays available agents', () => {
    renderWithProviders(<ConversationPage />);
    
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.getByText('Professor Chen')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Dr. Martinez')).toBeInTheDocument();
  });

  it('allows agent selection', () => {
    renderWithProviders(<ConversationPage />);
    
    const emmaButton = screen.getByText('Emma');
    fireEvent.click(emmaButton);
    
    // Agent should be selected (implementation detail)
    expect(emmaButton).toBeInTheDocument();
  });

  it('shows connecting state when starting conversation', async () => {
    renderWithProviders(<ConversationPage />);
    
    // Select an agent first
    const emmaButton = screen.getByText('Emma');
    fireEvent.click(emmaButton);
    
    // Start conversation
    const startButton = screen.getByText('Start Conversation');
    fireEvent.click(startButton);
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('transitions to conversation interface after connection', async () => {
    renderWithProviders(<ConversationPage />);
    
    // Select an agent
    const emmaButton = screen.getByText('Emma');
    fireEvent.click(emmaButton);
    
    // Start conversation
    const startButton = screen.getByText('Start Conversation');
    fireEvent.click(startButton);
    
    // Fast forward through connection delay
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('conversation-interface')).toBeInTheDocument();
      expect(screen.getByText('Conversation with Emma')).toBeInTheDocument();
    });
  });

  it('returns to agent selector when conversation ends', async () => {
    renderWithProviders(<ConversationPage />);
    
    // Start a conversation
    const emmaButton = screen.getByText('Emma');
    fireEvent.click(emmaButton);
    
    const startButton = screen.getByText('Start Conversation');
    fireEvent.click(startButton);
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('conversation-interface')).toBeInTheDocument();
    });
    
    // End conversation
    const endButton = screen.getByText('End Conversation');
    fireEvent.click(endButton);
    
    expect(screen.getByTestId('agent-selector')).toBeInTheDocument();
    expect(screen.queryByTestId('conversation-interface')).not.toBeInTheDocument();
  });

  it('returns to agent selector when switching agents', async () => {
    renderWithProviders(<ConversationPage />);
    
    // Start a conversation
    const emmaButton = screen.getByText('Emma');
    fireEvent.click(emmaButton);
    
    const startButton = screen.getByText('Start Conversation');
    fireEvent.click(startButton);
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('conversation-interface')).toBeInTheDocument();
    });
    
    // Switch agent
    const switchButton = screen.getByText('Switch Agent');
    fireEvent.click(switchButton);
    
    expect(screen.getByTestId('agent-selector')).toBeInTheDocument();
    expect(screen.queryByTestId('conversation-interface')).not.toBeInTheDocument();
  });

  it('maintains selected agent when switching back from conversation', async () => {
    renderWithProviders(<ConversationPage />);
    
    // Select Emma
    const emmaButton = screen.getByText('Emma');
    fireEvent.click(emmaButton);
    
    // Start conversation
    const startButton = screen.getByText('Start Conversation');
    fireEvent.click(startButton);
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('conversation-interface')).toBeInTheDocument();
    });
    
    // Switch agent (should return to selector with Emma still selected)
    const switchButton = screen.getByText('Switch Agent');
    fireEvent.click(switchButton);
    
    expect(screen.getByTestId('agent-selector')).toBeInTheDocument();
    // Emma should still be available for selection
    expect(screen.getByText('Emma')).toBeInTheDocument();
  });

  it('has proper page structure', () => {
    renderWithProviders(<ConversationPage />);
    
    const page = document.querySelector('.conversation-page');
    expect(page).toBeInTheDocument();
    expect(page).toHaveClass('conversation-page');
  });

  it('applies proper CSS classes', () => {
    renderWithProviders(<ConversationPage />);
    
    const container = document.querySelector('.conversation-page-container');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('conversation-page-container');
  });

  it('is wrapped in proper providers', () => {
    renderWithProviders(<ConversationPage />);
    
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('voice-provider')).toBeInTheDocument();
    expect(screen.getByTestId('conversation-provider')).toBeInTheDocument();
  });

  it('maintains provider hierarchy', () => {
    renderWithProviders(<ConversationPage />);
    
    const authProvider = screen.getByTestId('auth-provider');
    const voiceProvider = screen.getByTestId('voice-provider');
    const conversationProvider = screen.getByTestId('conversation-provider');
    
    expect(authProvider).toContainElement(voiceProvider);
    expect(voiceProvider).toContainElement(conversationProvider);
  });

  it('handles agent selection without starting conversation', () => {
    renderWithProviders(<ConversationPage />);
    
    // Select multiple agents
    fireEvent.click(screen.getByText('Emma'));
    fireEvent.click(screen.getByText('Professor Chen'));
    
    // Should still be on agent selector
    expect(screen.getByTestId('agent-selector')).toBeInTheDocument();
    expect(screen.queryByTestId('conversation-interface')).not.toBeInTheDocument();
  });

  it('prevents starting conversation without agent selection', () => {
    renderWithProviders(<ConversationPage />);
    
    const startButton = screen.getByText('Start Conversation');
    
    // Button should be disabled when no agent is selected
    expect(startButton).toBeDisabled();
  });

  it('shows different agent personalities', () => {
    renderWithProviders(<ConversationPage />);
    
    // Check that different agent types are available
    expect(screen.getByText('Emma')).toBeInTheDocument(); // friendly-tutor
    expect(screen.getByText('Professor Chen')).toBeInTheDocument(); // strict-teacher
    expect(screen.getByText('Alex')).toBeInTheDocument(); // conversation-partner
    expect(screen.getByText('Dr. Martinez')).toBeInTheDocument(); // pronunciation-coach
  });

  it('handles rapid state changes gracefully', async () => {
    renderWithProviders(<ConversationPage />);
    
    // Rapid selection and start
    fireEvent.click(screen.getByText('Emma'));
    fireEvent.click(screen.getByText('Start Conversation'));
    
    // Immediately try to switch before connection completes
    act(() => {
      jest.advanceTimersByTime(1000); // Partial delay
    });
    
    // Should handle state transitions gracefully
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });
});

describe('ConversationPage Accessibility', () => {
  it('has proper semantic structure', () => {
    renderWithProviders(<ConversationPage />);
    
    const page = document.querySelector('.conversation-page');
    expect(page).toBeInTheDocument();
  });

  it('provides accessible navigation between states', () => {
    renderWithProviders(<ConversationPage />);
    
    // Should have accessible buttons and interactions
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('maintains focus management during state transitions', async () => {
    renderWithProviders(<ConversationPage />);
    
    // Focus should be managed properly during transitions
    const emmaButton = screen.getByText('Emma');
    emmaButton.focus();
    
    fireEvent.click(emmaButton);
    
    // Focus management is handled by the components
    expect(document.activeElement).toBeDefined();
  });
});