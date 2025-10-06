import { FriendlyTutorAgent } from '../personalities/friendly-tutor';
import { ConversationContext } from '@/shared/types';
import { AGENT_PERSONALITIES } from '@/shared/constants';

// Mock the BedrockService
jest.mock('@/backend/services/bedrock-client');

describe('FriendlyTutorAgent', () => {
  let agent: FriendlyTutorAgent;
  let mockContext: ConversationContext;

  beforeEach(() => {
    agent = new FriendlyTutorAgent('us-east-1');
    
    mockContext = {
      sessionId: 'test-session',
      userId: 'test-user',
      conversationHistory: [],
      userProfile: {
        languageLevel: 'intermediate',
        targetLanguage: 'English',
        learningGoals: ['confidence-building', 'conversation-fluency']
      },
      currentTopic: 'daily-routine'
    };
  });

  describe('Personality Configuration', () => {
    test('has correct personality traits', () => {
      const personality = agent.getPersonality();
      
      expect(personality.id).toBe(AGENT_PERSONALITIES.FRIENDLY_TUTOR);
      expect(personality.name).toBe('Maya - Friendly Tutor');
      expect(personality.traits).toContain('patient');
      expect(personality.traits).toContain('encouraging');
      expect(personality.traits).toContain('supportive');
      expect(personality.conversationStyle).toBe('friendly-tutor');
    });

    test('has supportive approach configuration', () => {
      const personality = agent.getPersonality();
      
      expect(personality.supportiveApproach.errorHandling).toBe('gentle-correction');
      expect(personality.supportiveApproach.encouragementFrequency).toBe('high');
      expect(personality.supportiveApproach.difficultyAdjustment).toBe('automatic');
    });

    test('has appropriate voice characteristics', () => {
      const personality = agent.getPersonality();
      
      expect(personality.voiceCharacteristics.voiceId).toBe('Joanna');
      expect(personality.voiceCharacteristics.engine).toBe('neural');
      expect(personality.voiceCharacteristics.speakingRate).toBe('medium');
    });

    test('has correct specialties', () => {
      const personality = agent.getPersonality();
      
      expect(personality.specialties).toContain('conversation-practice');
      expect(personality.specialties).toContain('confidence-building');
      expect(personality.specialties).toContain('beginner-support');
    });
  });

  describe('Emotional State Analysis', () => {
    test('detects high frustration from conversation history', async () => {
      const frustratedContext = {
        ...mockContext,
        conversationHistory: [
          { role: 'user' as const, content: 'This is too difficult for me' },
          { role: 'assistant' as const, content: 'Let me help you' },
          { role: 'user' as const, content: 'I don\'t understand anything' },
          { role: 'assistant' as const, content: 'That\'s okay' },
          { role: 'user' as const, content: 'I\'m so confused' }
        ]
      };

      const emotionalState = await agent.analyzeUserEmotionalState(frustratedContext);
      
      expect(emotionalState.frustrationLevel).toBeGreaterThan(0.5);
      expect(emotionalState.confidenceLevel).toBeLessThan(0.5);
    });

    test('detects high confidence from conversation history', async () => {
      const confidentContext = {
        ...mockContext,
        conversationHistory: [
          { role: 'user' as const, content: 'I think this sentence is correct because it follows the grammar rule we learned' },
          { role: 'assistant' as const, content: 'Excellent analysis!' },
          { role: 'user' as const, content: 'Maybe I can try using more complex vocabulary in this context' }
        ]
      };

      const emotionalState = await agent.analyzeUserEmotionalState(confidentContext);
      
      expect(emotionalState.confidenceLevel).toBeGreaterThan(0.5);
      expect(emotionalState.frustrationLevel).toBeLessThan(0.3);
    });

    test('detects engagement level from questions and interaction', async () => {
      const engagedContext = {
        ...mockContext,
        conversationHistory: [
          { role: 'user' as const, content: 'How do I use this grammar structure?' },
          { role: 'assistant' as const, content: 'Great question!' },
          { role: 'user' as const, content: 'What about in this situation?' },
          { role: 'assistant' as const, content: 'Let me explain' },
          { role: 'user' as const, content: 'Why is it different from my native language?' }
        ]
      };

      const emotionalState = await agent.analyzeUserEmotionalState(engagedContext);
      
      expect(emotionalState.engagementLevel).toBeGreaterThan(0.6);
    });
  });

  describe('Encouragement Generation', () => {
    test('provides personality-specific encouragement', () => {
      const encouragement = (agent as any).getPersonalitySpecificEncouragement();
      
      expect(typeof encouragement).toBe('string');
      expect(encouragement.length).toBeGreaterThan(10);
      // Should sound friendly and supportive
      expect(encouragement.toLowerCase()).toMatch(/(wonderful|great|proud|love|amazing|beautiful|excellent)/);
    });

    test('generates motivational messages based on progress', async () => {
      const progressMetrics = {
        sessionsCompleted: 10,
        overallImprovement: 0.15,
        streakDays: 5,
        grammarProgress: 0.8,
        fluencyProgress: 0.7,
        vocabularyGrowth: 0.6,
        confidenceLevel: 0.75,
        totalPracticeTime: 3600
      };

      const motivationalMessage = await agent.provideEncouragement(progressMetrics);
      
      expect(motivationalMessage.type).toBe('milestone');
      expect(motivationalMessage.message).toContain('10');
      expect(motivationalMessage.personalizedElements).toContain('10 sessions milestone');
    });
  });

  describe('Feedback Generation', () => {
    test('generates gentle grammar feedback', async () => {
      const contextWithGrammarIssue = {
        ...mockContext,
        conversationHistory: [
          {
            role: 'user' as const,
            content: 'I am go to the store yesterday',
            messageId: 'msg-123',
            sender: 'user' as const,
            timestamp: new Date()
          }
        ]
      };

      const feedback = await (agent as any).generateContextualFeedback(
        contextWithGrammarIssue,
        'Let me help you with that'
      );

      expect(feedback).toHaveLength(1);
      expect(feedback[0].type).toBe('correction');
      expect(feedback[0].content).toMatch(/(gentle|tip|great effort)/i);
    });

    test('suggests vocabulary enhancements encouragingly', async () => {
      const contextWithBasicVocab = {
        ...mockContext,
        conversationHistory: [
          {
            role: 'user' as const,
            content: 'The movie was very good and I had a good time',
            messageId: 'msg-124',
            sender: 'user' as const,
            timestamp: new Date()
          }
        ]
      };

      const feedback = await (agent as any).generateContextualFeedback(
        contextWithBasicVocab,
        'That sounds wonderful!'
      );

      const vocabularyFeedback = feedback.find(f => f.type === 'vocabulary-tip');
      expect(vocabularyFeedback).toBeDefined();
      expect(vocabularyFeedback?.content).toMatch(/(excellent|wonderful|fantastic|try)/i);
    });

    test('provides encouragement for complex attempts', async () => {
      const contextWithComplexAttempt = {
        ...mockContext,
        conversationHistory: [
          {
            role: 'user' as const,
            content: 'Although I was tired yesterday, I decided to go to the gym because I wanted to maintain my fitness routine',
            messageId: 'msg-125',
            sender: 'user' as const,
            timestamp: new Date()
          }
        ]
      };

      const feedback = await (agent as any).generateContextualFeedback(
        contextWithComplexAttempt,
        'Excellent sentence structure!'
      );

      const encouragementFeedback = feedback.find(f => f.type === 'encouragement');
      expect(encouragementFeedback).toBeDefined();
      expect(encouragementFeedback?.content).toMatch(/(love|complex|progress)/i);
    });
  });

  describe('Topic Suggestions', () => {
    test('suggests appropriate topics for beginners', async () => {
      const beginnerContext = {
        ...mockContext,
        userProfile: {
          ...mockContext.userProfile!,
          currentLevel: 'beginner' as const
        }
      };

      const suggestion = await (agent as any).suggestNextTopic(beginnerContext);
      
      expect(suggestion).toContain('basic');
      expect(suggestion.toLowerCase()).toMatch(/(introduction|family|yourself)/);
    });

    test('suggests advanced topics for advanced users', async () => {
      const advancedContext = {
        ...mockContext,
        userProfile: {
          ...mockContext.userProfile!,
          currentLevel: 'advanced' as const
        }
      };

      const suggestion = await (agent as any).suggestNextTopic(advancedContext);
      
      expect(suggestion.toLowerCase()).toMatch(/(current events|opinions|discuss)/);
    });

    test('provides friendly and engaging topic suggestions', async () => {
      const suggestion = await (agent as any).suggestNextTopic(mockContext);
      
      expect(suggestion).toMatch(/[!?]/); // Should have enthusiasm
      expect(suggestion.toLowerCase()).toMatch(/(love|enjoy|fun|great|practice)/);
    });
  });

  describe('Grammar Issue Detection', () => {
    test('detects common grammar mistakes', () => {
      const detectGrammarIssues = (agent as any).detectGrammarIssues.bind(agent);
      
      expect(detectGrammarIssues('I am go to school')).toBe(true);
      expect(detectGrammarIssues('He don\'t like pizza')).toBe(true);
      expect(detectGrammarIssues('I can to swim')).toBe(true);
      expect(detectGrammarIssues('This is more better')).toBe(true);
      
      expect(detectGrammarIssues('I go to school every day')).toBe(false);
      expect(detectGrammarIssues('He doesn\'t like pizza')).toBe(false);
    });

    test('generates appropriate gentle corrections', () => {
      const generateGentleGrammarFeedback = (agent as any).generateGentleGrammarFeedback.bind(agent);
      
      const feedback1 = generateGentleGrammarFeedback('I am go to the store');
      expect(feedback1).toMatch(/(great effort|tip|I go|I am going)/i);
      
      const feedback2 = generateGentleGrammarFeedback('He don\'t like it');
      expect(feedback2).toMatch(/(nice try|doesn\'t|getting the hang)/i);
    });
  });

  describe('Response Enhancement', () => {
    test('adds friendly touches to encouraging responses', async () => {
      // Mock the parent class method
      const mockParentResponse = {
        content: 'You did well on that exercise.',
        emotionalTone: 'encouraging' as const,
        audioInstructions: {
          voiceId: 'Joanna'
        }
      };

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(agent)), 'generateSupportiveResponse')
        .mockResolvedValue(mockParentResponse);

      const response = await agent.generateSupportiveResponse(mockContext);
      
      // Should add warm opening phrases to encouraging responses
      expect(response.content).toMatch(/^(That's wonderful!|I'm so glad|Great question!|You're doing amazing!)/);
    });
  });

  describe('Conversation State Management', () => {
    test('adapts approach based on emotional state', () => {
      const highFrustrationState = {
        frustrationLevel: 0.8,
        confidenceLevel: 0.2,
        engagementLevel: 0.3,
        lastInteractionTime: new Date()
      };

      agent.adaptToUserEmotionalState(highFrustrationState);
      
      expect(agent.getConversationState('approachMode')).toBe('extra-supportive');
    });

    test('maintains conversation state across interactions', () => {
      agent.updateConversationState('testKey', 'testValue');
      
      expect(agent.getConversationState('testKey')).toBe('testValue');
    });
  });
});