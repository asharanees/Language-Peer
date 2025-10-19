import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { ProgressMetrics, ConversationSession } from '../types';
import './ProgressPage.css';

interface ProgressData {
  overallProgress: number;
  weeklyGoal: number;
  sessionsThisWeek: number;
  totalSessions: number;
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  recentSessions: Array<{
    date: string;
    duration: number;
    accuracy: number;
    agent: string;
  }>;
  skillBreakdown: {
    grammar: number;
    pronunciation: number;
    vocabulary: number;
    fluency: number;
  };
}

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);

  const fetchUserProgress = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real app, this would fetch from your API
      // For now, we'll simulate fetching user-specific data
      const userData = await simulateProgressFetch(user!.id);
      setProgressData(userData);
    } catch (err) {
      setError('Failed to load progress data');
      console.error('Error fetching progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateProgressFetch = async (userId: string): Promise<ProgressData> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate user-specific progress data based on userId
    const userSeed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (seed: number) => (seed * 9301 + 49297) % 233280 / 233280;
    
    const baseProgress = 40 + (userSeed % 40); // 40-80% base progress
    const sessionsCompleted = Math.floor(5 + (userSeed % 20)); // 5-25 sessions
    const currentStreak = Math.floor(1 + (userSeed % 14)); // 1-14 days
    
    return {
      overallProgress: baseProgress,
      weeklyGoal: 5,
      sessionsThisWeek: Math.min(5, Math.floor(currentStreak / 2)),
      totalSessions: sessionsCompleted,
      totalHours: Math.round((sessionsCompleted * 25 / 60) * 10) / 10, // ~25min per session
      currentStreak,
      longestStreak: currentStreak + Math.floor(userSeed % 10),
      recentSessions: generateRecentSessions(userSeed, Math.min(5, sessionsCompleted)),
      skillBreakdown: {
        grammar: Math.floor(baseProgress + (random(userSeed + 1) * 20 - 10)),
        pronunciation: Math.floor(baseProgress + (random(userSeed + 2) * 20 - 10)),
        vocabulary: Math.floor(baseProgress + (random(userSeed + 3) * 20 - 10)),
        fluency: Math.floor(baseProgress + (random(userSeed + 4) * 20 - 10))
      }
    };
  };

  const generateRecentSessions = (seed: number, count: number) => {
    const agents = ['Emma', 'Professor Chen', 'Alex', 'Riley', 'Maria'];
    const sessions = [];
    
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      sessions.push({
        date: date.toISOString().split('T')[0],
        duration: 20 + Math.floor((seed + i) % 20), // 20-40 minutes
        accuracy: 75 + Math.floor((seed + i * 2) % 20), // 75-95% accuracy
        agent: agents[(seed + i) % agents.length]
      });
    }
    
    return sessions;
  };

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

  if (isLoading) {
    return (
      <div className="progress-page">
        <div className="container">
          <div className="progress-loading">
            <h1>Learning Progress</h1>
            <p>Loading your progress data...</p>
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="progress-page">
        <div className="container">
          <div className="progress-error">
            <h1>Learning Progress</h1>
            <p>{error || 'Failed to load progress data'}</p>
            <Button variant="primary" onClick={fetchUserProgress}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

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