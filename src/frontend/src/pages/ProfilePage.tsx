import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    targetLanguage: user?.targetLanguage || 'English',
    nativeLanguage: user?.nativeLanguage || 'Spanish',
    currentLevel: user?.currentLevel || 'beginner'
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = () => {
    // In a real app, this would update the user via API
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      targetLanguage: user.targetLanguage,
      nativeLanguage: user.nativeLanguage,
      currentLevel: user.currentLevel
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <div className="profile-actions">
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <div className="edit-actions">
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="form-value">{user.name}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                ) : (
                  <div className="form-value">{user.email}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="targetLanguage">Learning</label>
                {isEditing ? (
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
                ) : (
                  <div className="form-value">{user.targetLanguage}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="nativeLanguage">Native Language</label>
                {isEditing ? (
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
                ) : (
                  <div className="form-value">{user.nativeLanguage}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="currentLevel">Current Level</label>
                {isEditing ? (
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
                ) : (
                  <div className="form-value">
                    {user.currentLevel.charAt(0).toUpperCase() + user.currentLevel.slice(1)}
                  </div>
                )}
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