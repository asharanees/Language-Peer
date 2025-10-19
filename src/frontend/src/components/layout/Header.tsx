import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

// Components
import { Button } from '../ui/Button';
import { AuthModal } from '../auth/AuthModal';

// Hooks
import { useAuth } from '../../hooks/useAuth';

export const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const location = useLocation();
  const { user, logout } = useAuth();

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Practice', href: '/conversation', current: location.pathname === '/conversation' },
    { name: 'Progress', href: '/progress', current: location.pathname === '/progress' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <div className="header-logo">
            <Link to="/" className="logo-link">
              <div className="logo-icon">🗣️</div>
              <span className="logo-text">LanguagePeer</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="header-nav desktop-nav">
            <ul className="nav-list">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`nav-link ${item.current ? 'nav-link--active' : ''}`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Actions */}
          <div className="header-actions">
            {user ? (
              <div className="user-menu">
                <span className="user-greeting">Hi, {user.email.split('@')[0]}</span>
                <Button
                  variant="outline"
                  size="small"
                  onClick={logout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => openAuthModal('login')}
                >
                  Login
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => openAuthModal('signup')}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="mobile-menu-button"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className={`hamburger ${isMobileMenuOpen ? 'hamburger--open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className={`mobile-nav ${isMobileMenuOpen ? 'mobile-nav--open' : ''}`}>
          <ul className="mobile-nav-list">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`mobile-nav-link ${item.current ? 'mobile-nav-link--active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
            <li className="mobile-nav-divider"></li>
            <li>
              <Link
                to="/settings"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </header>
  );
};