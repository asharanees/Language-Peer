import { AgentFactory } from '../coordination/agent-factory';
import { AGENT_PERSONALITIES } from '@/shared/constants';
import { UserProfile, ConversationContext } from '@/shared/types';

// Mock all agent classes
jest.mock('../personalities/friendly-tutor');
jest.mock('../personalities/strict-teacher');
jest.mock('../personalities/conversation-partner');
jest.mock('../personalities/pronunciation-coach');

describe('AgentFactory', () => {
  let agentFactory: AgentFactory;
  let mockUserProfile: UserProfile;
  let mockContext: ConversationContext;

  beforeEach(() => {
    agentFactory = new AgentFactory('us-east-1');
    
    mockUserProfile = {
      userId: 'test-user',
      targetLanguage: 'English',
      nativeLanguage: 'Spanish',
      currentLevel: 'intermediate',
      learningGoals: ['conversation-fluency'],
      preferredAgents: [],
      conversationTopics: ['travel', 'food'],
      progressMetrics: {
        overallImprovement: 0.1,
        grammarProgress: 0.7,
        fluencyProgress: 0.6,
        vocabularyGrowth: 0.5,
        confidenceLevel: 0.8,
        sessionsCompleted: 5,
        totalPracticeTime: 1800,
        streakDays: 3
      },
      lastSessionDate: new Date(),
      totalSessionTime: 1800,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockContext = {
      sessionId: 'test-session',
      userId: 'test-user',
      conversationHistory: [],
      userProfile: mockUserProfile,
      currentTopic: 'travel'
    };
  });

  describe('Agent Initialization', () => {
    test('initializes all agent personalities', () => {
      const allAgents = agentFactory.getAllAgents();
      
      expect(allAgents).toHaveLength(4);
      
      const friendlyTutor = agentFactory.getAgent(AGENT_PERSONALITIES.FRIENDLY_TUTOR);
      const strictTeacher = agentFactory.getAgent(AGENT_PERSONALITIES.STRICT_TEACHER);
      const conversationPartner = agentFactory.getAgent(AGENT_PERSONALITIES.CONVERSATION_PARTNER);
      const pronunciationCoach = agentFactory.getAgent(AGENT_PERSONALITIES.PRONUNCIATION_COACH);
      
      expect(friendlyTutor).toBeDefined();
      expect(strictTeacher).toBeDefined();
      expect(conversationPartner).toBeDefined();
      expect(pronunciationCoach).toBeDefined();
    });

    test('returns null for non-existent agent', () => {
      const nonExistentAgent = agentFactory.getAgent('non-existent-agent');
      
      expect(nonExistentAgent).toBeNull();
    });
  });

  describe('Agent Recommendation Based on Learning Goals', () => {
    test('recommends pronunciation coach for pronunciation improvement goal', () => {
      const userWithPronunciationGoal = {
        ...mockUserProfile,
        learningGoals: ['pronunciation-improvement']
      };

      const recommendation = agentFactory.recommendAgent(userWithPronunciationGoal);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.PRONUNCIATION_COACH);
      expect(recommendation.confidence).toBe(0.8);
      expect(recommendation.reason).toContain('pronunciation');
    });

    test('recommends strict teacher for grammar accuracy goal', () => {
      const userWithGrammarGoal = {
        ...mockUserProfile,
        learningGoals: ['grammar-accuracy']
      };

      const recommendation = agentFactory.recommendAgent(userWithGrammarGoal);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.STRICT_TEACHER);
      expect(recommendation.confidence).toBe(0.8);
      expect(recommendation.reason).toContain('grammar');
    });

    test('recommends conversation partner for fluency goal', () => {
      const userWithFluencyGoal = {
        ...mockUserProfile,
        learningGoals: ['conversation-fluency']
      };

      const recommendation = agentFactory.recommendAgent(userWithFluencyGoal);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.CONVERSATION_PARTNER);
      expect(recommendation.confidence).toBe(0.8);
      expect(recommendation.reason).toContain('conversation');
    });

    test('recommends friendly tutor for confidence building goal', () => {
      const userWithConfidenceGoal = {
        ...mockUserProfile,
        learningGoals: ['confidence-building']
      };

      const recommendation = agentFactory.recommendAgent(userWithConfidenceGoal);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.FRIENDLY_TUTOR);
      expect(recommendation.confidence).toBe(0.8);
      expect(recommendation.reason).toContain('confidence');
    });
  });

  describe('Agent Recommendation Based on Language Level', () => {
    test('recommends friendly tutor for beginners', () => {
      const beginnerUser = {
        ...mockUserProfile,
        currentLevel: 'beginner' as const,
        learningGoals: ['vocabulary-expansion'] // Non-specific goal
      };

      const recommendation = agentFactory.recommendAgent(beginnerUser);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.FRIENDLY_TUTOR);
      expect(recommendation.reason).toContain('beginner');
    });

    test('recommends conversation partner for intermediate level', () => {
      const intermediateUser = {
        ...mockUserProfile,
        currentLevel: 'intermediate' as const,
        learningGoals: ['vocabulary-expansion'] // Non-specific goal
      };

      const recommendation = agentFactory.recommendAgent(intermediateUser);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.CONVERSATION_PARTNER);
      expect(recommendation.reason).toContain('intermediate');
    });

    test('recommends strict teacher for advanced level', () => {
      const advancedUser = {
        ...mockUserProfile,
        currentLevel: 'advanced' as const,
        learningGoals: ['vocabulary-expansion'] // Non-specific goal
      };

      const recommendation = agentFactory.recommendAgent(advancedUser);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.STRICT_TEACHER);
      expect(recommendation.reason).toContain('advanced');
    });

    test('recommends conversation partner for proficient level', () => {
      const proficientUser = {
        ...mockUserProfile,
        currentLevel: 'proficient' as const,
        learningGoals: ['vocabulary-expansion'] // Non-specific goal
      };

      const recommendation = agentFactory.recommendAgent(proficientUser);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.CONVERSATION_PARTNER);
      expect(recommendation.reason).toContain('proficient');
    });
  });

  describe('User Preference Priority', () => {
    test('prioritizes user preferred agent', () => {
      const userWithPreference = {
        ...mockUserProfile,
        preferredAgents: [AGENT_PERSONALITIES.STRICT_TEACHER],
        currentLevel: 'beginner' as const // Would normally recommend friendly tutor
      };

      const recommendation = agentFactory.recommendAgent(userWithPreference);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.STRICT_TEACHER);
      expect(recommendation.confidence).toBe(0.9);
      expect(recommendation.reason).toBe('User preference');
    });

    test('falls back to other criteria when preferred agent doesn\'t exist', () => {
      const userWithInvalidPreference = {
        ...mockUserProfile,
        preferredAgents: ['non-existent-agent'],
        currentLevel: 'beginner' as const
      };

      const recommendation = agentFactory.recommendAgent(userWithInvalidPreference);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.FRIENDLY_TUTOR);
      expect(recommendation.reason).toContain('beginner');
    });
  });

  describe('Context-Based Recommendations', () => {
    test('recommends pronunciation coach for low transcription confidence', () => {
      const contextWithPronunciationIssues = {
        ...mockContext,
        conversationHistory: [
          {
            role: 'user' as const,
            content: 'Hello how are you',
            transcriptionConfidence: 0.4,
            sender: 'user' as const,
            timestamp: new Date(),
            messageId: 'msg-1'
          },
          {
            role: 'user' as const,
            content: 'I am fine thank you',
            transcriptionConfidence: 0.3,
            sender: 'user' as const,
            timestamp: new Date(),
            messageId: 'msg-2'
          }
        ]
      };

      const recommendation = agentFactory.recommendAgent(mockUserProfile, contextWithPronunciationIssues);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.PRONUNCIATION_COACH);
      expect(recommendation.reason).toContain('transcription confidence');
    });

    test('recommends strict teacher for grammar-focused conversation', () => {
      const contextWithGrammarFocus = {
        ...mockContext,
        conversationHistory: [
          {
            role: 'user' as const,
            content: 'Can you help me with grammar rules?',
            sender: 'user' as const,
            timestamp: new Date(),
            messageId: 'msg-1'
          },
          {
            role: 'user' as const,
            content: 'I made a mistake in my sentence',
            sender: 'user' as const,
            timestamp: new Date(),
            messageId: 'msg-2'
          }
        ]
      };

      const recommendation = agentFactory.recommendAgent(mockUserProfile, contextWithGrammarFocus);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.STRICT_TEACHER);
      expect(recommendation.reason).toContain('Grammar-focused');
    });
  });

  describe('Agent Handoff Recommendations', () => {
    test('recommends handoff to friendly tutor when frustration is high', () => {
      const frustratedContext = {
        ...mockContext,
        conversationHistory: [
          { role: 'user' as const, content: 'This is too difficult', sender: 'user' as const, timestamp: new Date(), messageId: 'msg-1' },
          { role: 'user' as const, content: 'I don\'t understand anything', sender: 'user' as const, timestamp: new Date(), messageId: 'msg-2' },
          { role: 'user' as const, content: 'I\'m so confused', sender: 'user' as const, timestamp: new Date(), messageId: 'msg-3' }
        ]
      };

      const handoffRecommendation = agentFactory.recommendAgentHandoff(
        AGENT_PERSONALITIES.STRICT_TEACHER,
        frustratedContext,
        mockUserProfile
      );
      
      expect(handoffRecommendation).toBeDefined();
      expect(handoffRecommendation!.agentId).toBe(AGENT_PERSONALITIES.FRIENDLY_TUTOR);
      expect(handoffRecommendation!.reason).toContain('frustration');
    });

    test('recommends handoff to pronunciation coach for pronunciation issues', () => {
      const pronunciationIssueContext = {
        ...mockContext,
        conversationHistory: [
          {
            role: 'user' as const,
            content: 'Hello',
            transcriptionConfidence: 0.3,
            sender: 'user' as const,
            timestamp: new Date(),
            messageId: 'msg-1'
          },
          {
            role: 'user' as const,
            content: 'How are you',
            transcriptionConfidence: 0.4,
            sender: 'user' as const,
            timestamp: new Date(),
            messageId: 'msg-2'
          }
        ]
      };

      const handoffRecommendation = agentFactory.recommendAgentHandoff(
        AGENT_PERSONALITIES.FRIENDLY_TUTOR,
        pronunciationIssueContext,
        mockUserProfile
      );
      
      expect(handoffRecommendation).toBeDefined();
      expect(handoffRecommendation!.agentId).toBe(AGENT_PERSONALITIES.PRONUNCIATION_COACH);
      expect(handoffRecommendation!.reason).toContain('Pronunciation challenges');
    });

    test('returns null when no handoff is needed', () => {
      const normalContext = {
        ...mockContext,
        conversationHistory: [
          { role: 'user' as const, content: 'Hello, how are you today?', sender: 'user' as const, timestamp: new Date(), messageId: 'msg-1' },
          { role: 'user' as const, content: 'I\'m doing well, thank you for asking', sender: 'user' as const, timestamp: new Date(), messageId: 'msg-2' }
        ]
      };

      const handoffRecommendation = agentFactory.recommendAgentHandoff(
        AGENT_PERSONALITIES.FRIENDLY_TUTOR,
        normalContext,
        mockUserProfile
      );
      
      expect(handoffRecommendation).toBeNull();
    });
  });

  describe('Scenario-Based Agent Selection', () => {
    test('returns appropriate agents for pronunciation practice scenario', () => {
      const agents = agentFactory.getAgentsForScenario('pronunciation-practice');
      
      expect(agents).toHaveLength(2);
      expect(agents.some(agent => agent.getPersonality().id === AGENT_PERSONALITIES.PRONUNCIATION_COACH)).toBe(true);
      expect(agents.some(agent => agent.getPersonality().id === AGENT_PERSONALITIES.FRIENDLY_TUTOR)).toBe(true);
    });

    test('returns appropriate agents for grammar lesson scenario', () => {
      const agents = agentFactory.getAgentsForScenario('grammar-lesson');
      
      expect(agents).toHaveLength(2);
      expect(agents.some(agent => agent.getPersonality().id === AGENT_PERSONALITIES.STRICT_TEACHER)).toBe(true);
      expect(agents.some(agent => agent.getPersonality().id === AGENT_PERSONALITIES.FRIENDLY_TUTOR)).toBe(true);
    });

    test('returns appropriate agents for casual conversation scenario', () => {
      const agents = agentFactory.getAgentsForScenario('casual-conversation');
      
      expect(agents).toHaveLength(2);
      expect(agents.some(agent => agent.getPersonality().id === AGENT_PERSONALITIES.CONVERSATION_PARTNER)).toBe(true);
      expect(agents.some(agent => agent.getPersonality().id === AGENT_PERSONALITIES.FRIENDLY_TUTOR)).toBe(true);
    });

    test('returns empty array for unknown scenario', () => {
      const agents = agentFactory.getAgentsForScenario('unknown-scenario');
      
      expect(agents).toHaveLength(0);
    });
  });

  describe('Default Recommendations', () => {
    test('provides default recommendation when no specific criteria match', () => {
      const minimalUser = {
        ...mockUserProfile,
        learningGoals: [],
        preferredAgents: [],
        currentLevel: 'intermediate' as const
      };

      const recommendation = agentFactory.recommendAgent(minimalUser);
      
      // Should still get a recommendation (likely conversation partner for intermediate)
      expect(recommendation).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThan(0);
    });

    test('provides fallback recommendation when no criteria match', () => {
      const emptyUser = {
        ...mockUserProfile,
        learningGoals: [] as any[],
        preferredAgents: [],
        currentLevel: 'intermediate' as const
      };

      // Mock to simulate no matching recommendations
      const originalRecommendAgent = agentFactory.recommendAgent;
      jest.spyOn(agentFactory, 'recommendAgent').mockImplementation((userProfile) => {
        if (userProfile.learningGoals.length === 0) {
          return {
            agentId: AGENT_PERSONALITIES.FRIENDLY_TUTOR,
            confidence: 0.5,
            reason: 'Default friendly approach'
          };
        }
        return originalRecommendAgent.call(agentFactory, userProfile);
      });

      const recommendation = agentFactory.recommendAgent(emptyUser);
      
      expect(recommendation.agentId).toBe(AGENT_PERSONALITIES.FRIENDLY_TUTOR);
      expect(recommendation.confidence).toBe(0.5);
      expect(recommendation.reason).toBe('Default friendly approach');
    });
  });
});