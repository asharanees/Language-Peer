import React, { useState, useRef, useEffect } from 'react';
import { VoiceRecorder } from '../voice/VoiceRecorder';
import { AudioPlayer } from '../voice/AudioPlayer';
import { TranscriptDisplay } from '../voice/TranscriptDisplay';
import { Button } from '../ui/Button';
import { Agent } from './AgentSelector';
import './ConversationInterface.css';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  audioBlob?: Blob;
  transcription?: string;
  confidence?: number;
  feedback?: LanguageFeedback;
}

export interface LanguageFeedback {
  grammarScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  suggestions: string[];
  corrections: string[];
  encouragement: string;
}

interface ConversationInterfaceProps {
  agent: Agent;
  onEndConversation: () => void;
  onSwitchAgent: () => void;
  className?: string;
}

export const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  agent,
  onEndConversation,
  onSwitchAgent,
  className = ''
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [currentAgentMessage, setCurrentAgentMessage] = useState<string>('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<Date>(new Date());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update session duration
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const duration = Math.floor((now.getTime() - sessionStartTime.current.getTime()) / 1000);
      setSessionDuration(duration);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize conversation with agent greeting
  useEffect(() => {
    const initializeConversation = async () => {
      const greeting = generateAgentGreeting(agent);
      const agentMessage: ConversationMessage = {
        id: `agent-${Date.now()}`,
        type: 'agent',
        content: greeting,
        timestamp: new Date()
      };
      
      setMessages([agentMessage]);
      
      // Simulate agent speaking
      setIsAgentSpeaking(true);
      setCurrentAgentMessage(greeting);
      
      // Simulate TTS completion
      setTimeout(() => {
        setIsAgentSpeaking(false);
        setCurrentAgentMessage('');
      }, greeting.length * 50); // Rough estimate of speaking time
    };

    initializeConversation();
  }, [agent]);

  const generateAgentGreeting = (agent: Agent): string => {
    const greetings = {
      'friendly-tutor': `Hi there! I'm ${agent.name}, your friendly language tutor. I'm excited to help you practice today! What would you like to talk about?`,
      'strict-teacher': `Good day. I am ${agent.name}. We will focus on proper grammar and pronunciation today. Please speak clearly and I will provide detailed feedback.`,
      'conversation-partner': `Hey! I'm ${agent.name}. Let's have a natural conversation - just like talking with a friend. What's on your mind today?`,
      'pronunciation-coach': `Hello! I'm ${agent.name}, your pronunciation coach. I'll help you perfect your speech patterns. Let's start with some practice sentences.`
    };
    
    return greetings[agent.personality] || `Hello! I'm ${agent.name}. Let's start practicing!`;
  };

  const handleRecordingComplete = async (audioBlob: Blob, transcript: string) => {
    if (!transcript.trim()) return;

    // Add user message
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: transcript,
      timestamp: new Date(),
      audioBlob,
      audioUrl: URL.createObjectURL(audioBlob),
      transcription: transcript,
      confidence: 0.85 // Mock confidence score
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate agent processing and response
    setIsAgentSpeaking(true);
    
    try {
      const agentResponse = await generateAgentResponse(transcript, agent, messages);
      const feedback = await generateLanguageFeedback(transcript);
      
      const agentMessage: ConversationMessage = {
        id: `agent-${Date.now()}`,
        type: 'agent',
        content: agentResponse,
        timestamp: new Date(),
        feedback
      };

      // Add agent response after a delay
      setTimeout(() => {
        setMessages(prev => [...prev, agentMessage]);
        setCurrentAgentMessage(agentResponse);
        
        // Simulate TTS completion
        setTimeout(() => {
          setIsAgentSpeaking(false);
          setCurrentAgentMessage('');
        }, agentResponse.length * 50);
      }, 1500);

    } catch (error) {
      console.error('Failed to generate agent response:', error);
      setIsAgentSpeaking(false);
    }
  };

  const generateAgentResponse = async (userInput: string, agent: Agent, history: ConversationMessage[]): Promise<string> => {
    // Mock agent response generation
    // In production, this would call the Bedrock API
    
    const responses = {
      'friendly-tutor': [
        "That's great! I can see you're making progress. Let me help you with that...",
        "Wonderful! Your pronunciation is improving. Have you considered trying...",
        "I love your enthusiasm! Let's explore that topic further..."
      ],
      'strict-teacher': [
        "I notice some grammatical errors in your sentence. The correct form would be...",
        "Your pronunciation needs work. Please repeat after me...",
        "Pay attention to your verb tenses. Let me explain the proper usage..."
      ],
      'conversation-partner': [
        "Oh, that's interesting! I had a similar experience once...",
        "I totally understand what you mean. Have you ever tried...",
        "That reminds me of something. Let me tell you about..."
      ],
      'pronunciation-coach': [
        "Good attempt! Let's focus on the 'th' sound in that word...",
        "I can hear improvement in your intonation. Now let's work on...",
        "Excellent! Your rhythm is getting much better. Try this next..."
      ]
    };

    const agentResponses = responses[agent.personality] || responses['friendly-tutor'];
    const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
    
    return randomResponse;
  };

  const generateLanguageFeedback = async (transcript: string): Promise<LanguageFeedback> => {
    // Mock feedback generation
    // In production, this would use AWS Comprehend and Bedrock
    
    return {
      grammarScore: Math.floor(Math.random() * 30) + 70, // 70-100
      fluencyScore: Math.floor(Math.random() * 25) + 75, // 75-100
      vocabularyScore: Math.floor(Math.random() * 20) + 80, // 80-100
      suggestions: [
        "Try using more varied vocabulary",
        "Consider using transition words",
        "Practice speaking at a steady pace"
      ],
      corrections: [],
      encouragement: "You're doing great! Keep practicing and you'll see improvement."
    };
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTranscriptUpdate = (transcript: string, isPartial: boolean) => {
    // Handle real-time transcript updates if needed
  };

  const handleError = (error: string) => {
    console.error('Conversation error:', error);
    // Handle errors gracefully
  };

  return (
    <div className={`conversation-interface ${className}`}>
      {/* Header */}
      <div className="conversation-header">
        <div className="conversation-agent-info">
          <div className="agent-avatar-small">
            {agent.avatar || '🤖'}
          </div>
          <div className="agent-details">
            <h3 className="agent-name">{agent.name}</h3>
            <span className="agent-status">
              {isAgentSpeaking ? 'Speaking...' : isConnected ? 'Listening' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="conversation-controls">
          <div className="session-info">
            <span className="session-duration">{formatDuration(sessionDuration)}</span>
            <span className="message-count">{messages.length} messages</span>
          </div>
          
          <div className="header-buttons">
            <Button
              variant="ghost"
              size="small"
              onClick={() => setShowFeedback(!showFeedback)}
              leftIcon="📊"
            >
              Feedback
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={onSwitchAgent}
              leftIcon="🔄"
            >
              Switch Agent
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={onEndConversation}
              leftIcon="🏁"
            >
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="conversation-main">
        {/* Messages */}
        <div className="conversation-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.type === 'user' ? 'message--user' : 'message--agent'}`}
            >
              <div className="message-avatar">
                {message.type === 'user' ? '👤' : (agent.avatar || '🤖')}
              </div>
              
              <div className="message-content">
                <div className="message-header">
                  <span className="message-sender">
                    {message.type === 'user' ? 'You' : agent.name}
                  </span>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                <div className="message-text">{message.content}</div>
                
                {message.audioUrl && (
                  <div className="message-audio">
                    <AudioPlayer
                      audioUrl={message.audioUrl}
                      audioBlob={message.audioBlob}
                      title={`${message.type === 'user' ? 'Your' : agent.name + "'s"} message`}
                      showDownload={false}
                    />
                  </div>
                )}
                
                {message.confidence && (
                  <div className="message-confidence">
                    Confidence: {Math.round(message.confidence * 100)}%
                  </div>
                )}
                
                {showFeedback && message.feedback && (
                  <div className="message-feedback">
                    <div className="feedback-scores">
                      <span>Grammar: {message.feedback.grammarScore}%</span>
                      <span>Fluency: {message.feedback.fluencyScore}%</span>
                      <span>Vocabulary: {message.feedback.vocabularyScore}%</span>
                    </div>
                    {message.feedback.suggestions.length > 0 && (
                      <div className="feedback-suggestions">
                        <strong>Suggestions:</strong>
                        <ul>
                          {message.feedback.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Agent typing indicator */}
          {isAgentSpeaking && (
            <div className="message message--agent message--typing">
              <div className="message-avatar">
                {agent.avatar || '🤖'}
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                {currentAgentMessage && (
                  <div className="current-message">{currentAgentMessage}</div>
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Input */}
        <div className="conversation-input">
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            onTranscriptUpdate={handleTranscriptUpdate}
            onError={handleError}
            maxDuration={120} // 2 minutes max
            autoTranscribe={true}
            className="conversation-voice-recorder"
          />
        </div>
      </div>
    </div>
  );
};