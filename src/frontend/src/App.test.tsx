import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock all the context providers and hooks
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>
}));

jest.mock('./contexts/VoiceContext', () => ({
  VoiceProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="voice-provider">{children}</div>
}));

jest.mock('./contexts/ConversationContext', () => ({
  ConversationProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="conversation-provider">{children}</div>
}));

jest.mock('./hooks/useVoicePermissions', () => ({
  useVoicePermissions: () => ({
    hasPermission: false,
    requestPermission: jest.fn()
  })
}));

test('renders app', () => {
  render(<App />);
  expect(screen.getByText('Initializing LanguagePeer...')).toBeInTheDocument();
});