import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import './ProgressPage.css';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="progress-page">
        <div className="container">
          <div className="progress-empty">
            <h1>Learning Progress</h1>
            <p>Please log in to view your learning progress.</p>
            <Button variant="primary" onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const progressData = {
    overallProgress: 68,
    weeklyGoal: 5,
    sessionsThisWeek: 3,
    totalSessions: 12,
    totalHours: 3.2,
    currentStreak: 7,
    longestStreak: 12,
    recentSessions: [
      { date: '2024-10-15', duration: 25, accuracy: 87, agent: 'Emma' },
      { date: '2024-10-14', duration: 30, accuracy: 92, agent: 'Professor Chen' },
      { date: '2024-10-13', duration: 20, accuracy: 85, agent: 'Alex' },
      { date: '2024-10-12', duration: 35, accuracy: 89, agent: 'Riley' },
      { date: '2024-10-11', duration: 28, accuracy: 91, agent: 'Emma' }
    ],
    skillBreakdown: {
      grammar: 75,
      pronunciation: 82,
      vocabulary: 68,
      fluency: 71
    }
  };

  return (
    <div className="progress-page">
      <div className="container">
        <div className="progress-header">
          <h1>Learning Progress</h1>
          <div className="progress-summary">
            <div className="summary-card">
              <div className="summary-number">{progressData.overallProgress}%</div>
              <div className="summary-label">Overall Progress</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{progressData.currentStreak}</div>
              <div className="summary-label">Day Streak</div>
            </div>
            <div className="summary-card">
              <div className="summary-number">{progressData.totalHours}h</div>
              <div className="summary-label">Total Practice</div>
            </div>
          </div>
        </div>

        <div className="progress-content">
          <div className="progress-section">
            <h2>Weekly Goal</h2>
            <div className="goal-card">
              <div className="goal-progress">
                <div className="goal-bar">
                  <div 
                    className="goal-fill" 
                    style={{ width: `${(progressData.sessionsThisWeek / progressData.weeklyGoal) * 100}%` }}
                  ></div>
                </div>
                <div className="goal-text">
                  {progressData.sessionsThisWeek} of {progressData.weeklyGoal} sessions this week
                </div>
              </div>
            </div>
          </div>

          <div className="progress-section">
            <h2>Skill Breakdown</h2>
            <div className="skills-grid">
              {Object.entries(progressData.skillBreakdown).map(([skill, score]) => (
                <div key={skill} className="skill-card">
                  <div className="skill-header">
                    <span className="skill-name">
                      {skill.charAt(0).toUpperCase() + skill.slice(1)}
                    </span>
                    <span className="skill-score">{score}%</span>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-fill" 
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="progress-section">
            <h2>Recent Sessions</h2>
            <div className="sessions-list">
              {progressData.recentSessions.map((session, index) => (
                <div key={index} className="session-card">
                  <div className="session-date">
                    {new Date(session.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="session-details">
                    <div className="session-agent">with {session.agent}</div>
                    <div className="session-stats">
                      <span className="session-duration">{session.duration}min</span>
                      <span className="session-accuracy">{session.accuracy}% accuracy</span>
                    </div>
                  </div>
                  <div className="session-score">
                    <div className={`score-badge ${session.accuracy >= 90 ? 'excellent' : session.accuracy >= 80 ? 'good' : 'fair'}`}>
                      {session.accuracy >= 90 ? 'Excellent' : session.accuracy >= 80 ? 'Good' : 'Fair'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="progress-section">
            <h2>Achievements</h2>
            <div className="achievements-grid">
              <div className="achievement-card earned">
                <div className="achievement-icon">🎯</div>
                <div className="achievement-title">First Session</div>
                <div className="achievement-desc">Complete your first practice session</div>
              </div>
              <div className="achievement-card earned">
                <div className="achievement-icon">🔥</div>
                <div className="achievement-title">Week Warrior</div>
                <div className="achievement-desc">Practice for 7 days in a row</div>
              </div>
              <div className="achievement-card">
                <div className="achievement-icon">⭐</div>
                <div className="achievement-title">Perfect Score</div>
                <div className="achievement-desc">Get 100% accuracy in a session</div>
              </div>
              <div className="achievement-card">
                <div className="achievement-icon">🏆</div>
                <div className="achievement-title">Marathon</div>
                <div className="achievement-desc">Practice for 30 days in a row</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};