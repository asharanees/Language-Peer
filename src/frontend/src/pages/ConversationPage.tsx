import React, { useState } from 'react';
import { AgentSelector, Agent } from '../components/conversation/AgentSelector';
import { ConversationInterface } from '../components/conversation/ConversationInterface';
import './ConversationPage.css';

// Mock agents data
const mockAgents: Agent[] = [
  {
    id: 'friendly-tutor-1',
    name: 'Emma',
    personality: 'friendly-tutor',
    description: 'A patient and encouraging tutor who makes learning fun and stress-free.',
    traits: ['Patient', 'Encouraging', 'Supportive', 'Positive'],
    avatar: '👩‍🏫',
    voiceCharacteristics: {
      voice: 'Joanna',
      speed: 1.0,
      pitch: 1.0
    },
    specialties: ['Grammar', 'Vocabulary', 'Conversation'],
    difficulty: 'beginner'
  },
  {
    id: 'strict-teacher-1',
    name: 'Professor Chen',
    personality: 'strict-teacher',
    description: 'A disciplined educator focused on precision and proper language structure.',
    traits: ['Precise', 'Detailed', 'Structured', 'Professional'],
    avatar: '👨‍💼',
    voiceCharacteristics: {
      voice: 'Matthew',
      speed: 0.9,
      pitch: 0.9
    },
    specialties: ['Grammar', 'Pronunciation', 'Formal Speech'],
    difficulty: 'advanced'
  },
  {
    id: 'conversation-partner-1',
    name: 'Alex',
    personality: 'conversation-partner',
    description: 'A friendly conversation partner for natural, everyday language practice.',
    traits: ['Casual', 'Friendly', 'Relatable', 'Natural'],
    avatar: '🗣️',
    voiceCharacteristics: {
      voice: 'Joey',
      speed: 1.1,
      pitch: 1.0
    },
    specialties: ['Casual Conversation', 'Idioms', 'Cultural Context'],
    difficulty: 'intermediate'
  },
  {
    id: 'pronunciation-coach-1',
    name: 'Dr. Martinez',
    personality: 'pronunciation-coach',
    description: 'A specialized coach focused on perfecting pronunciation and accent.',
    traits: ['Focused', 'Technical', 'Methodical', 'Expert'],
    avatar: '🎯',
    voiceCharacteristics: {
      voice: 'Lupe',
      speed: 0.8,
      pitch: 1.0
    },
    specialties: ['Pronunciation', 'Accent Training', 'Phonetics'],
    difficulty: 'all'
  }
];

export const ConversationPage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>(undefined);
  const [isInConversation, setIsInConversation] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleStartConversation = async () => {
    if (!selectedAgent) return;

    setIsConnecting(true);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsInConversation(true);
    }, 2000);
  };

  const handleEndConversation = () => {
    setIsInConversation(false);
    setSelectedAgent(undefined);
  };

  const handleSwitchAgent = () => {
    setIsInConversation(false);
    // Keep selectedAgent to show it as selected when returning to selector
  };

  if (isInConversation && selectedAgent) {
    return (
      <ConversationInterface
        agent={selectedAgent}
        onEndConversation={handleEndConversation}
        onSwitchAgent={handleSwitchAgent}
      />
    );
  }

  return (
    <div className="conversation-page">
      <div className="conversation-page-container">
        <AgentSelector
          agents={mockAgents}
          selectedAgent={selectedAgent}
          onAgentSelect={handleAgentSelect}
          onStartConversation={handleStartConversation}
          isLoading={isConnecting}
        />
      </div>
    </div>
  );
};