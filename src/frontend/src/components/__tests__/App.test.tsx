import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

// Mock all the context providers and hooks
jest.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn()
  })
}));

jest.mock('../../contexts/VoiceContext', () => ({
  VoiceProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="voice-provider">{children}</div>,
  useVoice: () => ({
    isListening: false,
    hasPermission: false,
    startListening: jest.fn(),
    stopListening: jest.fn()
  })
}));

jest.mock('../../contexts/ConversationContext', () => ({
  ConversationProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="conversation-provider">{children}</div>
}));

jest.mock('../../hooks/useVoicePermissions', () => ({
  useVoicePermissions: () => ({
    hasPermission: false,
    requestPermission: jest.fn()
  })
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="router">{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div data-testid="route">{element}</div>,
  Navigate: () => <div data-testid="navigate">Navigate</div>
}));

// Mock page components
jest.mock('../../pages/HomePage', () => ({
  HomePage: () => <div data-testid="home-page">Home Page</div>
}));

jest.mock('../../pages/ConversationPage', () => ({
  ConversationPage: () => <div data-testid="conversation-page">Conversation Page</div>
}));

jest.mock('../../pages/ProfilePage', () => ({
  ProfilePage: () => <div data-testid="profile-page">Profile Page</div>
}));

jest.mock('../../pages/ProgressPage', () => ({
  ProgressPage: () => <div data-testid="progress-page">Progress Page</div>
}));

jest.mock('../../pages/SettingsPage', () => ({
  SettingsPage: () => <div data-testid="settings-page">Settings Page</div>
}));

// Mock layout components
jest.mock('../../components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>
}));

jest.mock('../../components/layout/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>
}));

jest.mock('../../components/common/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => <div data-testid="loading-spinner" data-size={size}>Loading...</div>
}));

jest.mock('../../components/common/Toast', () => ({
  Toast: ({ message, type, onClose }: { message: string; type?: string; onClose: () => void }) => (
    <div data-testid="toast" data-type={type} onClick={onClose}>
      {message}
    </div>
  )
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    render(<App />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Initializing LanguagePeer...')).toBeInTheDocument();
  });

  it('renders main app structure after loading', async () => {
    render(<App />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check that main app structure is rendered
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('voice-provider')).toBeInTheDocument();
    expect(screen.getByTestId('conversation-provider')).toBeInTheDocument();
    expect(screen.getByTestId('router')).toBeInTheDocument();
  });

  it('renders header and footer after loading', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders routes after loading', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getByTestId('routes')).toBeInTheDocument();
  });

  it('has proper app structure with main element', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    const appDiv = screen.getByTestId('router').closest('.app');
    expect(appDiv).toBeInTheDocument();
    
    const mainElement = appDiv?.querySelector('.app-main');
    expect(mainElement).toBeInTheDocument();
  });

  it('wraps components in proper provider hierarchy', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check provider nesting
    const authProvider = screen.getByTestId('auth-provider');
    const voiceProvider = screen.getByTestId('voice-provider');
    const conversationProvider = screen.getByTestId('conversation-provider');
    const router = screen.getByTestId('router');
    
    expect(authProvider).toContainElement(voiceProvider);
    expect(voiceProvider).toContainElement(conversationProvider);
    expect(conversationProvider).toContainElement(router);
  });

  it('applies correct CSS classes', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    }, { timeout: 2000 });
    
    const appDiv = screen.getByTestId('router').closest('.app');
    expect(appDiv).toHaveClass('app');
    
    const mainElement = appDiv?.querySelector('.app-main');
    expect(mainElement).toHaveClass('app-main');
  });

  it('shows loading spinner with correct size', () => {
    render(<App />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveAttribute('data-size', 'large');
  });

  it('has proper loading state structure', () => {
    render(<App />);
    
    const loadingDiv = screen.getByText('Initializing LanguagePeer...').closest('.app-loading');
    expect(loadingDiv).toBeInTheDocument();
    expect(loadingDiv).toHaveClass('app-loading');
  });
});