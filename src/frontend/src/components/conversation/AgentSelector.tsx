import React, { useState } from 'react';
import { Button } from '../ui/Button';
import './AgentSelector.css';

export interface Agent {
  id: string;
  name: string;
  personality: 'friendly-tutor' | 'strict-teacher' | 'conversation-partner' | 'pronunciation-coach';
  description: string;
  traits: string[];
  avatar: string;
  voiceCharacteristics: {
    voice: string;
    speed: number;
    pitch: number;
  };
  specialties: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all';
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent?: Agent;
  onAgentSelect: (agent: Agent) => void;
  onStartConversation: () => void;
  isLoading?: boolean;
  className?: string;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  selectedAgent,
  onAgentSelect,
  onStartConversation,
  isLoading = false,
  className = ''
}) => {
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const filteredAgents = agents.filter(agent => 
    filter === 'all' || agent.difficulty === 'all' || agent.difficulty === filter
  );

  const getPersonalityIcon = (personality: Agent['personality']): string => {
    switch (personality) {
      case 'friendly-tutor': return '👨‍🏫';
      case 'strict-teacher': return '👩‍💼';
      case 'conversation-partner': return '🗣️';
      case 'pronunciation-coach': return '🎯';
      default: return '🤖';
    }
  };

  const getPersonalityColor = (personality: Agent['personality']): string => {
    switch (personality) {
      case 'friendly-tutor': return 'var(--success-color, #10b981)';
      case 'strict-teacher': return 'var(--warning-color, #f59e0b)';
      case 'conversation-partner': return 'var(--primary-color, #3b82f6)';
      case 'pronunciation-coach': return 'var(--purple-color, #8b5cf6)';
      default: return 'var(--gray-500, #6b7280)';
    }
  };

  return (
    <div className={`agent-selector ${className}`}>
      {/* Header */}
      <div className="agent-selector-header">
        <h2 className="agent-selector-title">Choose Your AI Tutor</h2>
        <p className="agent-selector-subtitle">
          Select an AI agent that matches your learning style and goals
        </p>
      </div>

      {/* Difficulty Filter */}
      <div className="agent-selector-filters">
        <span className="filter-label">Difficulty Level:</span>
        <div className="filter-buttons">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`filter-btn ${filter === level ? 'filter-btn--active' : ''}`}
            >
              {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <div className="agent-grid">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className={`agent-card ${selectedAgent?.id === agent.id ? 'agent-card--selected' : ''}`}
            onClick={() => onAgentSelect(agent)}
          >
            {/* Agent Avatar */}
            <div className="agent-avatar">
              <div 
                className="agent-avatar-icon"
                style={{ backgroundColor: getPersonalityColor(agent.personality) }}
              >
                {agent.avatar || getPersonalityIcon(agent.personality)}
              </div>
              <div className="agent-personality-badge">
                {agent.personality.replace('-', ' ')}
              </div>
            </div>

            {/* Agent Info */}
            <div className="agent-info">
              <h3 className="agent-name">{agent.name}</h3>
              <p className="agent-description">{agent.description}</p>
              
              {/* Traits */}
              <div className="agent-traits">
                {agent.traits.slice(0, 3).map((trait, index) => (
                  <span key={index} className="agent-trait">
                    {trait}
                  </span>
                ))}
                {agent.traits.length > 3 && (
                  <span className="agent-trait agent-trait--more">
                    +{agent.traits.length - 3} more
                  </span>
                )}
              </div>

              {/* Specialties */}
              <div className="agent-specialties">
                <span className="specialties-label">Specializes in:</span>
                <div className="specialties-list">
                  {agent.specialties.slice(0, 2).map((specialty, index) => (
                    <span key={index} className="specialty-tag">
                      {specialty}
                    </span>
                  ))}
                  {agent.specialties.length > 2 && (
                    <span className="specialty-tag specialty-tag--more">
                      +{agent.specialties.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Difficulty Badge */}
              <div className="agent-difficulty">
                <span className={`difficulty-badge difficulty-badge--${agent.difficulty}`}>
                  {agent.difficulty === 'all' ? 'All Levels' : agent.difficulty}
                </span>
              </div>
            </div>

            {/* Selection Indicator */}
            {selectedAgent?.id === agent.id && (
              <div className="agent-selected-indicator">
                <span className="selected-icon">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredAgents.length === 0 && (
        <div className="agent-selector-empty">
          <span className="empty-icon">🔍</span>
          <p>No agents found for the selected difficulty level.</p>
          <Button
            variant="ghost"
            onClick={() => setFilter('all')}
          >
            Show All Agents
          </Button>
        </div>
      )}

      {/* Selected Agent Details */}
      {selectedAgent && (
        <div className="selected-agent-details">
          <div className="selected-agent-info">
            <div className="selected-agent-avatar">
              {selectedAgent.avatar || getPersonalityIcon(selectedAgent.personality)}
            </div>
            <div className="selected-agent-text">
              <h4>{selectedAgent.name}</h4>
              <p>Ready to start your conversation practice</p>
            </div>
          </div>
          
          <Button
            variant="primary"
            size="large"
            onClick={onStartConversation}
            isLoading={isLoading}
            leftIcon="🎤"
            className="start-conversation-btn"
          >
            {isLoading ? 'Connecting...' : 'Start Conversation'}
          </Button>
        </div>
      )}

      {/* Help Text */}
      <div className="agent-selector-help">
        <p>
          💡 <strong>Tip:</strong> Each agent has a unique teaching style. 
          Try different agents to find what works best for your learning goals.
        </p>
      </div>
    </div>
  );
};