import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    targetLanguage: 'English',
    nativeLanguage: 'Spanish',
    currentLevel: 'beginner'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
      onClose();
    } catch (err) {
      setError(mode === 'login' ? 'Invalid credentials' : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2>{mode === 'login' ? 'Welcome Back' : 'Join LanguagePeer'}</h2>
          <button className="auth-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label htmlFor="targetLanguage">Language to Learn</label>
                <select
                  id="targetLanguage"
                  name="targetLanguage"
                  value={formData.targetLanguage}
                  onChange={handleInputChange}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="nativeLanguage">Native Language</label>
                <select
                  id="nativeLanguage"
                  name="nativeLanguage"
                  value={formData.nativeLanguage}
                  onChange={handleInputChange}
                >
                  <option value="Spanish">Spanish</option>
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Italian">Italian</option>
                  <option value="Portuguese">Portuguese</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="currentLevel">Current Level</label>
                <select
                  id="currentLevel"
                  name="currentLevel"
                  value={formData.currentLevel}
                  onChange={handleInputChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={isLoading}
            className="auth-submit-btn"
          >
            {isLoading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};