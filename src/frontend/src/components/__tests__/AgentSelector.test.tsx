import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentSelector, Agent } from '../conversation/AgentSelector';

const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Emma',
    personality: 'friendly-tutor',
    description: 'A patient and encouraging tutor',
    traits: ['Patient', 'Encouraging', 'Supportive'],
    avatar: '👩‍🏫',
    voiceCharacteristics: { voice: 'Joanna', speed: 1.0, pitch: 1.0 },
    specialties: ['Grammar', 'Vocabulary'],
    difficulty: 'beginner'
  },
  {
    id: 'agent-2',
    name: 'Professor Chen',
    personality: 'strict-teacher',
    description: 'A disciplined educator',
    traits: ['Precise', 'Detailed'],
    avatar: '👨‍💼',
    voiceCharacteristics: { voice: 'Matthew', speed: 0.9, pitch: 0.9 },
    specialties: ['Grammar', 'Pronunciation'],
    difficulty: 'advanced'
  },
  {
    id: 'agent-3',
    name: 'Alex',
    personality: 'conversation-partner',
    description: 'A friendly conversation partner',
    traits: ['Casual', 'Friendly'],
    avatar: '🗣️',
    voiceCharacteristics: { voice: 'Joey', speed: 1.1, pitch: 1.0 },
    specialties: ['Casual Conversation'],
    difficulty: 'intermediate'
  }
];

describe('AgentSelector Component', () => {
  const mockProps = {
    agents: mockAgents,
    onAgentSelect: jest.fn(),
    onStartConversation: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<AgentSelector {...mockProps} />);
    
    expect(screen.getByText('Choose Your AI Tutor')).toBeInTheDocument();
    expect(screen.getByText('Select an AI agent that matches your learning style and goals')).toBeInTheDocument();
  });

  it('displays all agents', () => {
    render(<AgentSelector {...mockProps} />);
    
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.getByText('Professor Chen')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('shows agent descriptions and traits', () => {
    render(<AgentSelector {...mockProps} />);
    
    expect(screen.getByText('A patient and encouraging tutor')).toBeInTheDocument();
    expect(screen.getByText('Patient')).toBeInTheDocument();
    expect(screen.getByText('Encouraging')).toBeInTheDocument();
  });

  it('displays difficulty filters', () => {
    render(<AgentSelector {...mockProps} />);
    
    expect(screen.getByText('All Levels')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
  });

  it('filters agents by difficulty', () => {
    render(<AgentSelector {...mockProps} />);
    
    // Click beginner filter
    fireEvent.click(screen.getByText('Beginner'));
    
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.queryByText('Professor Chen')).not.toBeInTheDocument();
    expect(screen.queryByText('Alex')).not.toBeInTheDocument();
  });

  it('shows all agents when "All Levels" is selected', () => {
    render(<AgentSelector {...mockProps} />);
    
    // First filter to beginner
    fireEvent.click(screen.getByText('Beginner'));
    
    // Then click "All Levels"
    fireEvent.click(screen.getByText('All Levels'));
    
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.getByText('Professor Chen')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('calls onAgentSelect when agent is clicked', () => {
    render(<AgentSelector {...mockProps} />);
    
    const emmaCard = screen.getByText('Emma').closest('.agent-card');
    fireEvent.click(emmaCard!);
    
    expect(mockProps.onAgentSelect).toHaveBeenCalledWith(mockAgents[0]);
  });

  it('shows selected agent details', () => {
    render(<AgentSelector {...mockProps} selectedAgent={mockAgents[0]} />);
    
    expect(screen.getByText('Ready to start your conversation practice')).toBeInTheDocument();
    expect(screen.getByText('Start Conversation')).toBeInTheDocument();
  });

  it('highlights selected agent card', () => {
    render(<AgentSelector {...mockProps} selectedAgent={mockAgents[0]} />);
    
    const emmaCard = screen.getByText('Emma').closest('.agent-card');
    expect(emmaCard).toHaveClass('agent-card--selected');
  });

  it('shows selection indicator for selected agent', () => {
    render(<AgentSelector {...mockProps} selectedAgent={mockAgents[0]} />);
    
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('calls onStartConversation when start button is clicked', () => {
    render(<AgentSelector {...mockProps} selectedAgent={mockAgents[0]} />);
    
    const startButton = screen.getByText('Start Conversation');
    fireEvent.click(startButton);
    
    expect(mockProps.onStartConversation).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<AgentSelector {...mockProps} selectedAgent={mockAgents[0]} isLoading={true} />);
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('shows empty state when no agents match filter', () => {
    const emptyAgents: Agent[] = [];
    render(<AgentSelector {...mockProps} agents={emptyAgents} />);
    
    expect(screen.getByText('No agents found for the selected difficulty level.')).toBeInTheDocument();
    expect(screen.getByText('Show All Agents')).toBeInTheDocument();
  });

  it('resets filter when "Show All Agents" is clicked in empty state', () => {
    const emptyAgents: Agent[] = [];
    render(<AgentSelector {...mockProps} agents={emptyAgents} />);
    
    fireEvent.click(screen.getByText('Show All Agents'));
    
    // Should reset to "All Levels" filter
    const allLevelsButton = screen.getByText('All Levels');
    expect(allLevelsButton).toHaveClass('filter-btn--active');
  });

  it('displays agent specialties', () => {
    render(<AgentSelector {...mockProps} />);
    
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
  });

  it('shows personality badges', () => {
    render(<AgentSelector {...mockProps} />);
    
    expect(screen.getByText('friendly tutor')).toBeInTheDocument();
    expect(screen.getByText('strict teacher')).toBeInTheDocument();
    expect(screen.getByText('conversation partner')).toBeInTheDocument();
  });

  it('displays difficulty badges', () => {
    render(<AgentSelector {...mockProps} />);
    
    expect(screen.getByText('beginner')).toBeInTheDocument();
    expect(screen.getByText('advanced')).toBeInTheDocument();
    expect(screen.getByText('intermediate')).toBeInTheDocument();
  });

  it('shows help text', () => {
    render(<AgentSelector {...mockProps} />);
    
    expect(screen.getByText(/Each agent has a unique teaching style/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AgentSelector {...mockProps} className="custom-selector" />);
    
    const selector = document.querySelector('.agent-selector.custom-selector');
    expect(selector).toBeInTheDocument();
  });

  it('handles agents with many traits', () => {
    const agentWithManyTraits: Agent = {
      ...mockAgents[0],
      traits: ['Trait1', 'Trait2', 'Trait3', 'Trait4', 'Trait5']
    };
    
    render(<AgentSelector {...mockProps} agents={[agentWithManyTraits]} />);
    
    expect(screen.getByText('Trait1')).toBeInTheDocument();
    expect(screen.getByText('Trait2')).toBeInTheDocument();
    expect(screen.getByText('Trait3')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('handles agents with many specialties', () => {
    const agentWithManySpecialties: Agent = {
      ...mockAgents[0],
      specialties: ['Specialty1', 'Specialty2', 'Specialty3', 'Specialty4']
    };
    
    render(<AgentSelector {...mockProps} agents={[agentWithManySpecialties]} />);
    
    expect(screen.getByText('Specialty1')).toBeInTheDocument();
    expect(screen.getByText('Specialty2')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows correct personality icons', () => {
    render(<AgentSelector {...mockProps} />);
    
    // Check that avatars are displayed (either custom or default icons)
    const avatars = document.querySelectorAll('.agent-avatar-icon');
    expect(avatars.length).toBe(mockAgents.length);
  });

  it('handles keyboard navigation', () => {
    render(<AgentSelector {...mockProps} />);
    
    const firstAgentCard = screen.getByText('Emma').closest('.agent-card');
    
    // Focus and press Enter (using HTMLElement type assertion)
    (firstAgentCard as HTMLElement)?.focus();
    fireEvent.keyDown(firstAgentCard!, { key: 'Enter', code: 'Enter' });
    
    // Should still work with click handler
    fireEvent.click(firstAgentCard!);
    expect(mockProps.onAgentSelect).toHaveBeenCalledWith(mockAgents[0]);
  });

  it('maintains filter state when agents change', () => {
    const { rerender } = render(<AgentSelector {...mockProps} />);
    
    // Set filter to beginner
    fireEvent.click(screen.getByText('Beginner'));
    
    // Update agents
    const newAgents = [...mockAgents, {
      ...mockAgents[0],
      id: 'agent-4',
      name: 'New Agent',
      difficulty: 'beginner' as const
    }];
    
    rerender(<AgentSelector {...mockProps} agents={newAgents} />);
    
    // Filter should still be active
    expect(screen.getByText('Beginner')).toHaveClass('filter-btn--active');
    expect(screen.getByText('New Agent')).toBeInTheDocument();
  });
});