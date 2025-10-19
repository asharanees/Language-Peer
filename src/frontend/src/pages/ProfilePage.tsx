import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();


  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="profile-empty">
            <h1>Profile</h1>
            <p>Please log in to view your profile.</p>
            <Button variant="primary" onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {user.email.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="form-value">{user.email}</div>
              </div>

              <div className="profile-setup-notice">
                <h3>Complete Your Profile</h3>
                <p>Additional profile features like language preferences and learning goals will be available in future updates.</p>
              </div>
            </div>
          </div>

          <div className="profile-stats">
            <h2>Learning Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">12</div>
                <div className="stat-label">Practice Sessions</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">3.2h</div>
                <div className="stat-label">Total Practice Time</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">85%</div>
                <div className="stat-label">Average Accuracy</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">7</div>
                <div className="stat-label">Day Streak</div>
              </div>
            </div>
          </div>

          <div className="profile-danger-zone">
            <h3>Account Actions</h3>
            <Button variant="secondary" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};