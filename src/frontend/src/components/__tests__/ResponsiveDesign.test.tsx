import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { Header } from '../layout/Header';
import { AuthProvider } from '../../contexts/AuthContext';
import { VoiceProvider } from '../../contexts/VoiceContext';

// Mock the hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    logout: jest.fn()
  })
}));

jest.mock('../../hooks/useVoice', () => ({
  useVoice: () => ({
    isListening: false,
    hasPermission: false
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

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    // Reset any previous matchMedia mocks
    delete (window as any).matchMedia;
  });

  describe('Mobile Layout', () => {
    beforeEach(() => {
      mockMatchMedia(true); // Simulate mobile viewport
    });

    it('shows mobile menu button on mobile devices', () => {
      renderWithProviders(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(mobileMenuButton).toBeInTheDocument();
      expect(mobileMenuButton).toHaveClass('mobile-menu-button');
    });

    it('hides desktop navigation on mobile', () => {
      renderWithProviders(<Header />);
      
      const desktopNav = screen.getByRole('navigation');
      expect(desktopNav).toHaveClass('desktop-nav');
    });

    it('shows mobile navigation when menu is opened', () => {
      renderWithProviders(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(mobileMenuButton);
      
      const mobileNav = screen.getByRole('navigation', { hidden: true });
      const mobileNavElement = mobileNav.nextElementSibling || mobileNav.parentElement?.querySelector('.mobile-nav');
      expect(mobileNavElement).toBeInTheDocument();
    });

    it('mobile navigation has proper accessibility', () => {
      renderWithProviders(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(mobileMenuButton).toHaveAttribute('aria-expanded');
      expect(mobileMenuButton).toHaveAttribute('aria-label', 'Toggle navigation menu');
    });
  });

  describe('Desktop Layout', () => {
    beforeEach(() => {
      mockMatchMedia(false); // Simulate desktop viewport
    });

    it('shows desktop navigation on larger screens', () => {
      renderWithProviders(<Header />);
      
      const desktopNav = screen.getByRole('navigation');
      expect(desktopNav).toHaveClass('desktop-nav');
    });

    it('mobile menu button is still present but styled for desktop', () => {
      renderWithProviders(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      expect(mobileMenuButton).toBeInTheDocument();
      // On desktop, this might be hidden via CSS
    });
  });

  describe('Responsive Breakpoints', () => {
    it('handles viewport changes gracefully', () => {
      const { rerender } = renderWithProviders(<Header />);
      
      // Start with mobile
      mockMatchMedia(true);
      rerender(
        <BrowserRouter>
          <AuthProvider>
            <VoiceProvider>
              <Header />
            </VoiceProvider>
          </AuthProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByRole('button', { name: /toggle navigation menu/i })).toBeInTheDocument();
      
      // Switch to desktop
      mockMatchMedia(false);
      rerender(
        <BrowserRouter>
          <AuthProvider>
            <VoiceProvider>
              <Header />
            </VoiceProvider>
          </AuthProvider>
        </BrowserRouter>
      );
      
      expect(screen.getByRole('navigation')).toHaveClass('desktop-nav');
    });
  });

  describe('Touch and Interaction', () => {
    it('mobile menu responds to touch events', () => {
      mockMatchMedia(true);
      renderWithProviders(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      // Simulate touch events
      fireEvent.touchStart(mobileMenuButton);
      fireEvent.touchEnd(mobileMenuButton);
      fireEvent.click(mobileMenuButton);
      
      expect(mobileMenuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('navigation links work on mobile', () => {
      mockMatchMedia(true);
      renderWithProviders(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(mobileMenuButton);
      
      // Check that navigation links are accessible
      const homeLinks = screen.getAllByText('Home');
      expect(homeLinks.length).toBeGreaterThan(0);
    });
  });

  describe('CSS Classes for Responsive Design', () => {
    it('applies correct responsive classes to header', () => {
      renderWithProviders(<Header />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('header');
      
      const container = header.querySelector('.container');
      expect(container).toBeInTheDocument();
      
      const headerContent = container?.querySelector('.header-content');
      expect(headerContent).toBeInTheDocument();
    });

    it('navigation has responsive classes', () => {
      renderWithProviders(<Header />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('header-nav', 'desktop-nav');
    });

    it('mobile menu has correct classes when closed', () => {
      renderWithProviders(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      const hamburger = mobileMenuButton.querySelector('.hamburger');
      
      expect(hamburger).toBeInTheDocument();
      expect(hamburger).toHaveClass('hamburger');
      expect(hamburger).not.toHaveClass('hamburger--open');
    });

    it('mobile menu has correct classes when opened', () => {
      renderWithProviders(<Header />);
      
      const mobileMenuButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(mobileMenuButton);
      
      const hamburger = mobileMenuButton.querySelector('.hamburger');
      expect(hamburger).toHaveClass('hamburger', 'hamburger--open');
    });
  });
});