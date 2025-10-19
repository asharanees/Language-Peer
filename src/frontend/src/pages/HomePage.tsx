import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

// Components
import { Button } from '../components/ui/Button';
import { VoicePermissionPrompt } from '../components/voice/VoicePermissionPrompt';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { useVoicePermissions } from '../hooks/useVoicePermissions';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission, requestPermission } = useVoicePermissions();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Practice Languages with
                <span className="hero-title-accent"> AI Tutors</span>
              </h1>
              <p className="hero-description">
                Experience voice-first language learning with intelligent AI agents 
                that adapt to your learning style and provide personalized feedback.
              </p>
              <div className="hero-actions">
                {user ? (
                  <Button
                    as={Link}
                    to="/conversation"
                    variant="primary"
                    size="large"
                    leftIcon="🗣️"
                  >
                    Start Practicing
                  </Button>
                ) : (
                  <Button
                    as={Link}
                    to="/conversation"
                    variant="primary"
                    size="large"
                  >
                    Get Started Free
                  </Button>
                )}
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-illustration">
                <div className="conversation-bubble conversation-bubble--user">
                  "Hello, how are you today?"
                </div>
                <div className="conversation-bubble conversation-bubble--ai">
                  "Great! Let's practice your pronunciation..."
                </div>
                <div className="voice-waves">
                  <div className="wave"></div>
                  <div className="wave"></div>
                  <div className="wave"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Permission Section */}
      {!hasPermission && (
        <section className="voice-permission-section">
          <div className="container">
            <VoicePermissionPrompt onRequestPermission={requestPermission} />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-header">
            <h2 className="section-title">Why Choose LanguagePeer?</h2>
            <p className="section-description">
              Our AI-powered platform provides personalized language learning 
              experiences that adapt to your unique needs and goals.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Tutors</h3>
              <p className="feature-description">
                Practice with multiple AI personalities, each specialized in 
                different aspects of language learning.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎤</div>
              <h3 className="feature-title">Voice-First</h3>
              <p className="feature-description">
                Focus on speaking and listening with real-time voice 
                recognition and pronunciation feedback.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Progress Tracking</h3>
              <p className="feature-description">
                Monitor your improvement with detailed analytics and 
                personalized recommendations.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Adaptive Learning</h3>
              <p className="feature-description">
                Content automatically adjusts to your skill level and 
                learning preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Your Language Journey?</h2>
            <p className="cta-description">
              Join thousands of learners who are improving their language skills 
              with LanguagePeer's AI tutors.
            </p>
            <div className="cta-actions">
              <Button
                as={Link}
                to="/conversation"
                variant="primary"
                size="large"
                leftIcon="🚀"
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};