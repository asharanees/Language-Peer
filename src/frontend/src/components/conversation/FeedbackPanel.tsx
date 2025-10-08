import React, { useState } from 'react';
import { LanguageFeedback } from './ConversationInterface';
import './FeedbackPanel.css';

interface FeedbackPanelProps {
  feedback: LanguageFeedback | null;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedback,
  isVisible,
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'scores' | 'suggestions' | 'corrections'>('scores');

  if (!isVisible || !feedback) {
    return null;
  }

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'var(--success-color, #10b981)';
    if (score >= 70) return 'var(--warning-color, #f59e0b)';
    return 'var(--error-color, #ef4444)';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Fair';
    return 'Needs Work';
  };

  const averageScore = Math.round(
    (feedback.grammarScore + feedback.fluencyScore + feedback.vocabularyScore) / 3
  );

  return (
    <div className={`feedback-panel ${className}`}>
      <div className="feedback-panel-overlay" onClick={onClose} />
      
      <div className="feedback-panel-content">
        {/* Header */}
        <div className="feedback-panel-header">
          <h3 className="feedback-panel-title">Language Feedback</h3>
          <button
            onClick={onClose}
            className="feedback-panel-close"
            aria-label="Close feedback panel"
          >
            ✕
          </button>
        </div>

        {/* Overall Score */}
        <div className="feedback-overall-score">
          <div className="overall-score-circle">
            <div 
              className="score-progress"
              style={{
                background: `conic-gradient(${getScoreColor(averageScore)} ${averageScore * 3.6}deg, var(--gray-200, #e5e7eb) 0deg)`
              }}
            >
              <div className="score-inner">
                <span className="score-number">{averageScore}</span>
                <span className="score-label">{getScoreLabel(averageScore)}</span>
              </div>
            </div>
          </div>
          <p className="overall-score-text">Overall Performance</p>
        </div>

        {/* Tabs */}
        <div className="feedback-tabs">
          <button
            onClick={() => setActiveTab('scores')}
            className={`feedback-tab ${activeTab === 'scores' ? 'feedback-tab--active' : ''}`}
          >
            📊 Scores
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`feedback-tab ${activeTab === 'suggestions' ? 'feedback-tab--active' : ''}`}
          >
            💡 Tips
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`feedback-tab ${activeTab === 'corrections' ? 'feedback-tab--active' : ''}`}
          >
            ✏️ Corrections
          </button>
        </div>

        {/* Tab Content */}
        <div className="feedback-tab-content">
          {activeTab === 'scores' && (
            <div className="feedback-scores-tab">
              <div className="score-breakdown">
                <div className="score-item">
                  <div className="score-item-header">
                    <span className="score-item-label">Grammar</span>
                    <span className="score-item-value">{feedback.grammarScore}%</span>
                  </div>
                  <div className="score-item-bar">
                    <div 
                      className="score-item-progress"
                      style={{ 
                        width: `${feedback.grammarScore}%`,
                        backgroundColor: getScoreColor(feedback.grammarScore)
                      }}
                    />
                  </div>
                </div>

                <div className="score-item">
                  <div className="score-item-header">
                    <span className="score-item-label">Fluency</span>
                    <span className="score-item-value">{feedback.fluencyScore}%</span>
                  </div>
                  <div className="score-item-bar">
                    <div 
                      className="score-item-progress"
                      style={{ 
                        width: `${feedback.fluencyScore}%`,
                        backgroundColor: getScoreColor(feedback.fluencyScore)
                      }}
                    />
                  </div>
                </div>

                <div className="score-item">
                  <div className="score-item-header">
                    <span className="score-item-label">Vocabulary</span>
                    <span className="score-item-value">{feedback.vocabularyScore}%</span>
                  </div>
                  <div className="score-item-bar">
                    <div 
                      className="score-item-progress"
                      style={{ 
                        width: `${feedback.vocabularyScore}%`,
                        backgroundColor: getScoreColor(feedback.vocabularyScore)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="feedback-suggestions-tab">
              {feedback.suggestions.length > 0 ? (
                <ul className="suggestions-list">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="suggestion-item">
                      <span className="suggestion-icon">💡</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-suggestions">
                  <span className="no-suggestions-icon">🎉</span>
                  <p>Great job! No specific suggestions at this time.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'corrections' && (
            <div className="feedback-corrections-tab">
              {feedback.corrections.length > 0 ? (
                <ul className="corrections-list">
                  {feedback.corrections.map((correction, index) => (
                    <li key={index} className="correction-item">
                      <span className="correction-icon">✏️</span>
                      <span className="correction-text">{correction}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-corrections">
                  <span className="no-corrections-icon">✅</span>
                  <p>Excellent! No corrections needed.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Encouragement */}
        <div className="feedback-encouragement">
          <div className="encouragement-icon">🌟</div>
          <p className="encouragement-text">{feedback.encouragement}</p>
        </div>

        {/* Actions */}
        <div className="feedback-actions">
          <button
            onClick={onClose}
            className="feedback-action-btn feedback-action-btn--primary"
          >
            Continue Practice
          </button>
        </div>
      </div>
    </div>
  );
};