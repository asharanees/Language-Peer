import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Toast } from './components/common/Toast';

// Pages
import { HomePage } from './pages/HomePage';
import { ConversationPage } from './pages/ConversationPage';

import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { VoiceProvider } from './contexts/VoiceContext';
import { ConversationProvider } from './contexts/ConversationContext';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useVoicePermissions } from './hooks/useVoicePermissions';

// Types
import { User } from './types';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Check for existing session
        // Initialize voice permissions
        // Load user preferences
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setToastMessage('Failed to initialize application');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>Initializing LanguagePeer...</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <VoiceProvider>
        <ConversationProvider>
          <Router>
            <div className="app">
              <Header />
              <main className="app-main">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/conversation" element={<ConversationPage />} />

                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
              {toastMessage && (
                <Toast
                  message={toastMessage}
                  type="error"
                  onClose={() => setToastMessage(null)}
                />
              )}
            </div>
          </Router>
        </ConversationProvider>
      </VoiceProvider>
    </AuthProvider>
  );
};

export default App;