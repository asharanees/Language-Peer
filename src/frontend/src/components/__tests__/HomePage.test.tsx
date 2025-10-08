import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { HomePage } from '../../pages/HomePage';
import { AuthProvider } from '../../contexts/AuthContext';
import { VoiceProvider } from '../../contexts/VoiceContext';

// Mock the hooks
jest.mock('../../hooks/useVoicePermissions', () => ({
  useVoicePermissions: () => ({
    hasPermission: false,
    requestPermission: jest.fn()
  })
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <VoiceProvider>
          {component}
        </VoiceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('HomePage Component', () => {
  it('renders hero section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText(/Practice Languages with/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Tutors/i)).toBeInTheDocument();
    expect(screen.getByText(/Experience voice-first language learning/i)).toBeInTheDocument();
  });

  it('renders features section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText(/Why Choose LanguagePeer/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Tutors/i)).toBeInTheDocument();
    expect(screen.getByText(/Voice-First/i)).toBeInTheDocument();
    expect(screen.getByText(/Progress Tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/Adaptive Learning/i)).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText(/Ready to Start Your Language Journey/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Free Trial/i)).toBeInTheDocument();
  });

  it('shows voice permission prompt when permission not granted', () => {
    renderWithProviders(<HomePage />);
    
    expect(screen.getByText(/Enable Voice Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Enable Microphone/i)).toBeInTheDocument();
  });
});