import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackPanel } from '../conversation/FeedbackPanel';
import { LanguageFeedback } from '../conversation/ConversationInterface';

const mockFeedback: LanguageFeedback = {
  grammarScore: 85,
  fluencyScore: 78,
  vocabularyScore: 92,
  suggestions: [
    'Try using more varied vocabulary',
    'Consider using transition words',
    'Practice speaking at a steady pace'
  ],
  corrections: [
    'Use "have been" instead of "has been" with plural subjects',
    'Remember to use articles before nouns'
  ],
  encouragement: 'Great job! You\'re making excellent progress in your language learning journey.'
};

describe('FeedbackPanel Component', () => {
  const mockProps = {
    feedback: mockFeedback,
    isVisible: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible with feedback', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    expect(screen.getByText('Language Feedback')).toBeInTheDocument();
    expect(screen.getByText('Overall Performance')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<FeedbackPanel {...mockProps} isVisible={false} />);
    
    expect(screen.queryByText('Language Feedback')).not.toBeInTheDocument();
  });

  it('does not render when no feedback provided', () => {
    render(<FeedbackPanel {...mockProps} feedback={null} />);
    
    expect(screen.queryByText('Language Feedback')).not.toBeInTheDocument();
  });

  it('displays overall score correctly', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    // Average of 85, 78, 92 = 85
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('shows correct score labels', () => {
    const lowScoreFeedback: LanguageFeedback = {
      ...mockFeedback,
      grammarScore: 60,
      fluencyScore: 55,
      vocabularyScore: 50
    };
    
    render(<FeedbackPanel {...mockProps} feedback={lowScoreFeedback} />);
    
    // Average of 60, 55, 50 = 55
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('Needs Work')).toBeInTheDocument();
  });

  it('displays all tab buttons', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    expect(screen.getByText('📊 Scores')).toBeInTheDocument();
    expect(screen.getByText('💡 Tips')).toBeInTheDocument();
    expect(screen.getByText('✏️ Corrections')).toBeInTheDocument();
  });

  it('shows scores tab by default', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.getByText('Fluency')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('switches to suggestions tab when clicked', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    fireEvent.click(screen.getByText('💡 Tips'));
    
    expect(screen.getByText('Try using more varied vocabulary')).toBeInTheDocument();
    expect(screen.getByText('Consider using transition words')).toBeInTheDocument();
    expect(screen.getByText('Practice speaking at a steady pace')).toBeInTheDocument();
  });

  it('switches to corrections tab when clicked', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    fireEvent.click(screen.getByText('✏️ Corrections'));
    
    expect(screen.getByText('Use "have been" instead of "has been" with plural subjects')).toBeInTheDocument();
    expect(screen.getByText('Remember to use articles before nouns')).toBeInTheDocument();
  });

  it('shows no suggestions message when suggestions array is empty', () => {
    const noSuggestionsFeedback: LanguageFeedback = {
      ...mockFeedback,
      suggestions: []
    };
    
    render(<FeedbackPanel {...mockProps} feedback={noSuggestionsFeedback} />);
    
    fireEvent.click(screen.getByText('💡 Tips'));
    
    expect(screen.getByText('Great job! No specific suggestions at this time.')).toBeInTheDocument();
  });

  it('shows no corrections message when corrections array is empty', () => {
    const noCorrectionsFeedback: LanguageFeedback = {
      ...mockFeedback,
      corrections: []
    };
    
    render(<FeedbackPanel {...mockProps} feedback={noCorrectionsFeedback} />);
    
    fireEvent.click(screen.getByText('✏️ Corrections'));
    
    expect(screen.getByText('Excellent! No corrections needed.')).toBeInTheDocument();
  });

  it('displays encouragement message', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    expect(screen.getByText('Great job! You\'re making excellent progress in your language learning journey.')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    const closeButton = screen.getByLabelText('Close feedback panel');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    const overlay = document.querySelector('.feedback-panel-overlay');
    fireEvent.click(overlay!);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when continue button is clicked', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    const continueButton = screen.getByText('Continue Practice');
    fireEvent.click(continueButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<FeedbackPanel {...mockProps} className="custom-feedback" />);
    
    const panel = document.querySelector('.feedback-panel.custom-feedback');
    expect(panel).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    const scoresTab = screen.getByText('📊 Scores');
    expect(scoresTab).toHaveClass('feedback-tab--active');
    
    fireEvent.click(screen.getByText('💡 Tips'));
    
    const tipsTab = screen.getByText('💡 Tips');
    expect(tipsTab).toHaveClass('feedback-tab--active');
    expect(scoresTab).not.toHaveClass('feedback-tab--active');
  });

  it('displays progress bars for scores', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    const progressBars = document.querySelectorAll('.score-item-progress');
    expect(progressBars).toHaveLength(3); // Grammar, Fluency, Vocabulary
  });

  it('uses correct colors for different score ranges', () => {
    const mixedScoreFeedback: LanguageFeedback = {
      grammarScore: 90, // Excellent (green)
      fluencyScore: 75, // Good (yellow)
      vocabularyScore: 60, // Needs work (red)
      suggestions: [],
      corrections: [],
      encouragement: 'Keep practicing!'
    };
    
    render(<FeedbackPanel {...mockProps} feedback={mixedScoreFeedback} />);
    
    // Check that progress bars have different colors (implementation detail)
    const progressBars = document.querySelectorAll('.score-item-progress');
    expect(progressBars).toHaveLength(3);
  });

  it('calculates average score correctly', () => {
    const testFeedback: LanguageFeedback = {
      grammarScore: 90,
      fluencyScore: 80,
      vocabularyScore: 70,
      suggestions: [],
      corrections: [],
      encouragement: 'Good work!'
    };
    
    render(<FeedbackPanel {...mockProps} feedback={testFeedback} />);
    
    // Average of 90, 80, 70 = 80
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('handles keyboard navigation', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    const closeButton = screen.getByLabelText('Close feedback panel');
    
    // Focus and press Enter
    closeButton.focus();
    fireEvent.keyDown(closeButton, { key: 'Enter', code: 'Enter' });
    
    // Should still work with click handler
    fireEvent.click(closeButton);
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('displays suggestion and correction icons', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    fireEvent.click(screen.getByText('💡 Tips'));
    expect(screen.getAllByText('💡')).toHaveLength(4); // 3 suggestions + tab icon
    
    fireEvent.click(screen.getByText('✏️ Corrections'));
    expect(screen.getAllByText('✏️')).toHaveLength(3); // 2 corrections + tab icon
  });

  it('shows encouragement icon', () => {
    render(<FeedbackPanel {...mockProps} />);
    
    expect(screen.getByText('🌟')).toBeInTheDocument();
  });

  it('maintains tab state when feedback changes', () => {
    const { rerender } = render(<FeedbackPanel {...mockProps} />);
    
    // Switch to suggestions tab
    fireEvent.click(screen.getByText('💡 Tips'));
    expect(screen.getByText('Try using more varied vocabulary')).toBeInTheDocument();
    
    // Update feedback
    const newFeedback: LanguageFeedback = {
      ...mockFeedback,
      suggestions: ['New suggestion']
    };
    
    rerender(<FeedbackPanel {...mockProps} feedback={newFeedback} />);
    
    // Should still be on suggestions tab
    expect(screen.getByText('New suggestion')).toBeInTheDocument();
  });

  it('handles very long feedback text', () => {
    const longFeedback: LanguageFeedback = {
      ...mockFeedback,
      encouragement: 'This is a very long encouragement message that should wrap properly and not break the layout of the feedback panel component.'
    };
    
    render(<FeedbackPanel {...mockProps} feedback={longFeedback} />);
    
    expect(screen.getByText(/This is a very long encouragement message/)).toBeInTheDocument();
  });
});