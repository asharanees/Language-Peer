import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceRecorder } from '../voice/VoiceRecorder';
import { AudioPlayer } from '../voice/AudioPlayer';
import { TranscriptDisplay } from '../voice/TranscriptDisplay';
import { Button } from '../ui/Button';
import { Agent } from './AgentSelector';
import { apiService, blobToBase64 } from '../../services/api';
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<Date>(new Date());
  const processingRef = useRef<boolean>(false);
  const lastProcessedTranscript = useRef<string>('');

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

  // Load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => v.name));
      };
      
      // Voices might not be loaded immediately
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      } else {
        loadVoices();
      }
      
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  // Initialize conversation with agent greeting
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        setIsLoading(true);

        // Generate session ID locally (no API call needed)
        const localSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(localSessionId);

        // Generate initial greeting
        const greeting = generateAgentGreeting(agent);
        const cleanedGreeting = cleanTextForTTS(greeting);
        const agentMessage: ConversationMessage = {
          id: `agent-${Date.now()}`,
          type: 'agent',
          content: cleanedGreeting,
          timestamp: new Date()
        };

        setMessages([agentMessage]);
        setCurrentAgentMessage(cleanedGreeting);
        
        // Speak the greeting
        await speakText(cleanedGreeting, agent.personality);

      } catch (error) {
        console.error('Failed to initialize conversation:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConversation();
  }, [agent]);

  // Clean emojis, hashtags, and dashes from text for better TTS experience
  const cleanTextForTTS = (text: string): string => {
    return text
      // Remove hashtags
      .replace(/#\w+/g, '')
      // Remove dashes (hyphens)
      .replace(/-/g, '')
      // Remove common emoji patterns (simple approach)
      .replace(/[^\w\s.,!?'"()]/g, '')
      // Remove multiple spaces and trim
      .replace(/\s+/g, ' ')
      .trim();
  };

  const generateAgentGreeting = (agent: Agent): string => {
    const greetings: Record<string, string> = {
      'friendly-tutor': `Hi! I'm ${agent.name}.`,
      'strict-teacher': `Good day. I am ${agent.name}.`,
      'conversation-partner': `Hey! I'm ${agent.name}.`,
      'pronunciation-coach': `Hello! I'm ${agent.name}.`
    };

    return greetings[agent.personality] || `Hello! I'm ${agent.name}.`;
  };

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, transcript: string) => {
    if (!transcript.trim() || processingRef.current || lastProcessedTranscript.current === transcript) return;

    processingRef.current = true;
    lastProcessedTranscript.current = transcript;
    setIsProcessing(true);
    setIsLoading(true);

    try {
      // Add user message
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: transcript,
        timestamp: new Date(),
        audioBlob,
        audioUrl: URL.createObjectURL(audioBlob),
        transcription: transcript,
        confidence: 0.85
      };

      setMessages(prev => [...prev, userMessage]);
      setIsAgentSpeaking(true);

      // Send message to agent API
      try {
        const conversationResponse = await apiService.sendMessage({
          message: transcript,
          agentPersonality: agent.personality,
          sessionId: sessionId || undefined
        });

        const cleanedResponse = cleanTextForTTS(conversationResponse.response);
        
        const agentMessage: ConversationMessage = {
          id: `agent-${Date.now()}`,
          type: 'agent',
          content: cleanedResponse,
          timestamp: new Date(),
          feedback: conversationResponse.feedback
        };

        // Add agent response
        setMessages(prev => [...prev, agentMessage]);
        setCurrentAgentMessage(cleanedResponse);

        // Speak the response
        await speakText(cleanedResponse, agent.personality);

      } catch (apiError) {
        console.warn('API unavailable, using offline mode:', apiError);
        setIsConnected(false);
        
        // Check if it's a network connectivity issue
        const isNetworkError = apiError instanceof Error && (
          apiError.message.includes('ERR_CONNECTION_RESET') ||
          apiError.message.includes('ERR_NETWORK') ||
          apiError.message.includes('Failed to fetch') ||
          apiError.message.includes('timeout')
        );
        
        if (isNetworkError) {
          console.log('Network connectivity issue detected, using offline mode');
        }

        // Enhanced offline response with realistic AI-like responses
        const offlineResponse = generateEnhancedOfflineResponse(transcript, agent, messages);
        const cleanedOfflineResponse = cleanTextForTTS(offlineResponse);
        const feedback = generateMockFeedback(transcript);

        const agentMessage: ConversationMessage = {
          id: `agent-${Date.now()}`,
          type: 'agent',
          content: cleanedOfflineResponse,
          timestamp: new Date(),
          feedback
        };

        setMessages(prev => [...prev, agentMessage]);
        setCurrentAgentMessage(cleanedOfflineResponse);

        // Speak the offline response
        await speakText(cleanedOfflineResponse, agent.personality);
      }

    } catch (error) {
      console.error('Failed to process message:', error);
      setIsAgentSpeaking(false);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, [agent, sessionId, messages]);

  const generateAgentResponse = async (userInput: string, agent: Agent, history: ConversationMessage[]): Promise<string> => {
    // Basic fallback responses
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

  const generateEnhancedOfflineResponse = (userInput: string, agent: Agent, history: ConversationMessage[]): string => {
    const input = userInput.toLowerCase();

    // Context-aware responses based on user input
    const contextualResponses = {
      'friendly-tutor': {
        greetings: [
          "Hi! I'm Emma.",
          "Hello! Ready to practice?"
        ],
        practice: [
          "Great topic!",
          "Good choice!"
        ],
        questions: [
          "Good question!",
          "Let me help."
        ],
        default: [
          "Nice work!",
          "Good job!"
        ]
      },
      'strict-teacher': {
        greetings: [
          "Good day. I am Professor Chen.",
          "Welcome. Let's focus on grammar."
        ],
        errors: [
          "I notice an error.",
          "Pay attention here."
        ],
        practice: [
          "This needs improvement.",
          "Focus on accuracy."
        ],
        default: [
          "We must strive for excellence.",
          "Pay careful attention."
        ]
      },
      'conversation-partner': {
        greetings: [
          "Hey! I'm Alex.",
          "Hi there! What's new?"
        ],
        personal: [
          "Cool! Tell me more.",
          "Interesting! What happened?"
        ],
        opinions: [
          "Good point!",
          "I see what you mean."
        ],
        default: [
          "That's cool!",
          "Nice! Great English."
        ]
      },
      'pronunciation-coach': {
        greetings: [
          "Hello! I'm Riley.",
          "Hi! Ready to practice?"
        ],
        sounds: [
          "Good try!",
          "Better! Keep going."
        ],
        rhythm: [
          "Nice rhythm!",
          "Good progress!"
        ],
        default: [
          "You're improving!",
          "Good work!"
        ]
      }
    };

    const agentResponses = contextualResponses[agent.personality];

    // Determine response category based on input
    let category = 'default';
    if (input.includes('hello') || input.includes('hi') || input.includes('good morning') || input.includes('good day')) {
      category = 'greetings';
    } else if (input.includes('practice') || input.includes('learn') || input.includes('study')) {
      category = 'practice';
    } else if (input.includes('?') || input.includes('how') || input.includes('what') || input.includes('why')) {
      category = 'questions';
    } else if (agent.personality === 'conversation-partner' && (input.includes('i ') || input.includes('my '))) {
      category = 'personal';
    } else if (agent.personality === 'conversation-partner' && (input.includes('think') || input.includes('believe'))) {
      category = 'opinions';
    } else if (agent.personality === 'pronunciation-coach' && (input.includes('sound') || input.includes('pronounce'))) {
      category = 'sounds';
    } else if (agent.personality === 'pronunciation-coach' && (input.includes('rhythm') || input.includes('stress'))) {
      category = 'rhythm';
    } else if (agent.personality === 'strict-teacher' && (input.includes('wrong') || input.includes('mistake'))) {
      category = 'errors';
    }

    const responses = (agentResponses as any)[category] || (agentResponses as any).default;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateMockFeedback = (transcript: string): LanguageFeedback => {
    // Generate realistic feedback based on input
    const wordCount = transcript.split(' ').length;
    const hasQuestions = transcript.includes('?');
    const hasComplexWords = transcript.split(' ').some(word => word.length > 6);

    return {
      grammarScore: Math.floor(Math.random() * 20) + 75 + (hasComplexWords ? 5 : 0),
      fluencyScore: Math.floor(Math.random() * 15) + 80 + (wordCount > 10 ? 5 : 0),
      vocabularyScore: Math.floor(Math.random() * 25) + 70 + (hasComplexWords ? 10 : 0),
      suggestions: [
        "Try using more varied vocabulary to express your ideas",
        "Consider using transition words to connect your thoughts",
        "Practice speaking at a steady, natural pace"
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      corrections: [],
      encouragement: [
        "You're doing great! Keep practicing and you'll see improvement.",
        "Excellent progress! Your confidence is really showing.",
        "Well done! I can see you're putting in good effort.",
        "Great job! Your English skills are developing nicely."
      ][Math.floor(Math.random() * 4)]
    };
  };

  // Get appropriate voice for each agent personality
  const getVoiceForAgent = (agentPersonality: string): string => {
    const voiceMap: Record<string, string> = {
      'friendly-tutor': 'Joanna',      // Emma - Friendly female voice
      'strict-teacher': 'Matthew',     // Professor Chen - Formal male voice  
      'conversation-partner': 'Amy',   // Alex - Casual female voice
      'pronunciation-coach': 'Brian'   // Riley - Clear male voice for pronunciation
    };
    
    return voiceMap[agentPersonality] || 'Joanna';
  };

  // Text-to-Speech function using browser Web Speech API
  const speakText = async (text: string, agentPersonality: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsAgentSpeaking(true);
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice based on agent personality
        const voices = window.speechSynthesis.getVoices();
        
        let preferredVoice = null;
        switch (agentPersonality) {
          case 'friendly-tutor':
            preferredVoice = voices.find(voice => 
              voice.name.toLowerCase().includes('female') || 
              voice.name.toLowerCase().includes('joanna') ||
              voice.name.toLowerCase().includes('samantha')
            );
            utterance.pitch = 1.1;
            utterance.rate = 0.9;
            break;
            
          case 'strict-teacher':
            preferredVoice = voices.find(voice => 
              voice.name.toLowerCase().includes('male') || 
              voice.name.toLowerCase().includes('matthew') ||
              voice.name.toLowerCase().includes('daniel')
            );
            utterance.pitch = 0.9;
            utterance.rate = 0.8;
            break;
            
          case 'conversation-partner':
            preferredVoice = voices.find(voice => 
              voice.name.toLowerCase().includes('english') && 
              (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('female'))
            );
            utterance.pitch = 1.0;
            utterance.rate = 1.0;
            break;
            
          case 'pronunciation-coach':
            preferredVoice = voices.find(voice => 
              voice.name.toLowerCase().includes('english') ||
              voice.name.toLowerCase().includes('us') ||
              voice.name.toLowerCase().includes('american')
            );
            utterance.pitch = 1.0;
            utterance.rate = 0.85;
            break;
            
          default:
            preferredVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        
        // Use preferred voice or fallback to first English voice
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        } else {
          const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
        }
        
        // Set volume and language
        utterance.volume = 0.8;
        utterance.lang = 'en-US';
        
        // Handle speech events
        utterance.onstart = () => {
          setIsAgentSpeaking(true);
        };
        
        utterance.onend = () => {
          setIsAgentSpeaking(false);
          setCurrentAgentMessage('');
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.warn('Speech synthesis error:', event.error);
          setIsAgentSpeaking(false);
          setCurrentAgentMessage('');
          resolve();
        };
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn('Speech synthesis not supported in this browser');
        // Fallback to text-only mode
        setTimeout(() => {
          setIsAgentSpeaking(false);
          setCurrentAgentMessage('');
          resolve();
        }, text.length * 50);
      }
    });
  };

  // Fallback to browser's Web Speech API
  const fallbackToWebSpeech = (text: string, agentPersonality: string, resolve?: () => void) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice based on agent personality
      const voices = window.speechSynthesis.getVoices();
      
      let preferredVoice = null;
      switch (agentPersonality) {
        case 'friendly-tutor':
          preferredVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('joanna') ||
            voice.name.toLowerCase().includes('samantha')
          );
          utterance.pitch = 1.1;
          utterance.rate = 0.9;
          break;
          
        case 'strict-teacher':
          preferredVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('male') || 
            voice.name.toLowerCase().includes('matthew') ||
            voice.name.toLowerCase().includes('daniel')
          );
          utterance.pitch = 0.9;
          utterance.rate = 0.8;
          break;
          
        case 'conversation-partner':
          // Alex - Look for a casual, friendly voice
          preferredVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('english') && 
            (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('female'))
          );
          utterance.pitch = 1.0;
          utterance.rate = 1.0;
          break;
          
        case 'pronunciation-coach':
          // Riley - Look for a clear, articulate voice
          preferredVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('english') ||
            voice.name.toLowerCase().includes('us') ||
            voice.name.toLowerCase().includes('american')
          );
          utterance.pitch = 1.0;
          utterance.rate = 0.85;
          break;
          
        default:
          preferredVoice = voices.find(voice => voice.lang.startsWith('en'));
      }
      
      // Use preferred voice or fallback to first English voice
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      } else {
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
      
      // Set volume and language
      utterance.volume = 0.8;
      utterance.lang = 'en-US';
      
      // Handle speech events
      utterance.onstart = () => {
        setIsAgentSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsAgentSpeaking(false);
        setCurrentAgentMessage('');
        resolve?.();
      };
      
      utterance.onerror = (event) => {
        console.warn('Speech synthesis error:', event.error);
        setIsAgentSpeaking(false);
        setCurrentAgentMessage('');
        resolve?.();
      };
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Speech synthesis not supported in this browser');
      // Fallback to text-only mode
      setTimeout(() => {
        setIsAgentSpeaking(false);
        setCurrentAgentMessage('');
        resolve?.();
      }, text.length * 50);
    }
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

  const handleTranscriptUpdate = useCallback((transcript: string, isPartial: boolean) => {
    // Handle real-time transcript updates if needed
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('Conversation error:', error);
    // Handle errors gracefully
  }, []);

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
              {isLoading ? 'Processing...' : isAgentSpeaking ? 'Speaking...' : isConnected ? 'Online' : 'Offline Mode'}
            </span>
            {!isConnected && (
              <span className="offline-indicator">
                📱 Offline Mode - Network connectivity issues detected
              </span>
            )}
          </div>
        </div>

        <div className="conversation-controls">
          <div className="session-info">
            <span className="session-duration">{formatDuration(sessionDuration)}</span>
            <span className="message-count">{messages.length} messages</span>
          </div>

          <div className="header-buttons">
            {isAgentSpeaking && (
              <Button
                variant="ghost"
                size="small"
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setIsAgentSpeaking(false);
                  setCurrentAgentMessage('');
                }}
                leftIcon="🔇"
              >
                Stop Speaking
              </Button>
            )}
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