import { BedrockClient } from './bedrock-client';
import { 
  UserProfile, 
  ConversationSession, 
  ProgressMetrics,
  LanguageLevel,
  LearningGoal 
} from '@/shared/types';
import { CONVERSATION_TOPICS, AGENT_PERSONALITIES, DIFFICULTY_LEVELS } from '@/shared/constants';

export interface TopicRecommendation {
  topic: string;
  relevanceScore: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  reason: string;
  estimatedDuration: number; // minutes
  prerequisites?: string[];
}

export interface AgentRecommendation {
  agentId: string;
  agentName: string;
  matchScore: number;
  reason: string;
  specialties: string[];
  recommendedFor: LearningGoal[];
}

export interface DifficultyRecommendation {
  recommendedDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  confidence: number;
  reasoning: string;
  adjustmentFactors: {
    recentPerformance: number;
    userLevel: number;
    sessionFrequency: number;
    errorRate: number;
  };
}

export interface SessionRecommendation {
  topics: TopicRecommendation[];
  agents: AgentRecommendation[];
  difficulty: DifficultyRecommendation;
  sessionLength: number; // minutes
  focusAreas: LearningGoal[];
  motivationalMessage: string;
}

export interface RecommendationEngine {
  recommendTopics(userProfile: UserProfile, sessionHistory: ConversationSession[]): Promise<TopicRecommendation[]>;
  recommendAgents(learningGoals: LearningGoal[], currentProgress: ProgressMetrics): Promise<AgentRecommendation[]>;
  recommendDifficulty(userProfile: UserProfile, recentSessions: ConversationSession[]): Promise<DifficultyRecommendation>;
  generateSessionRecommendations(userProfile: UserProfile, sessionHistory: ConversationSession[]): Promise<SessionRecommendation>;
  adaptToFeedback(userId: string, feedback: UserFeedback): Promise<void>;
}

export interface UserFeedback {
  sessionId: string;
  topicRating: number; // 1-5
  agentRating: number; // 1-5
  difficultyRating: number; // 1-5 (1=too easy, 5=too hard)
  overallSatisfaction: number; // 1-5
  comments?: string;
}

export class BedrockRecommendationEngine implements RecommendationEngine {
  private bedrockClient: BedrockClient;
  private userFeedbackHistory: Map<string, UserFeedback[]> = new Map();

  constructor(region?: string) {
    this.bedrockClient = new BedrockClient(region);
  }

  /**
   * Recommend conversation topics based on user profile and history
   */
  async recommendTopics(
    userProfile: UserProfile, 
    sessionHistory: ConversationSession[]
  ): Promise<TopicRecommendation[]> {
    try {
      // Analyze user's topic preferences and performance
      const topicPerformance = this.analyzeTopicPerformance(sessionHistory);
      const recentTopics = this.getRecentTopics(sessionHistory, 5);
      
      // Get Bedrock recommendations
      const bedrockRecommendations = await this.getBedrockTopicRecommendations(
        userProfile, 
        topicPerformance, 
        recentTopics
      );

      // Combine with rule-based recommendations
      const ruleBasedRecommendations = this.getRuleBasedTopicRecommendations(
        userProfile, 
        recentTopics
      );

      // Merge and rank recommendations
      const allRecommendations = [...bedrockRecommendations, ...ruleBasedRecommendations];
      const rankedRecommendations = this.rankTopicRecommendations(allRecommendations, userProfile);

      return rankedRecommendations.slice(0, 5); // Top 5 recommendations

    } catch (error) {
      console.error('Error recommending topics:', error);
      return this.getFallbackTopicRecommendations(userProfile);
    }
  }

  /**
   * Recommend AI agents based on learning goals and progress
   */
  async recommendAgents(
    learningGoals: LearningGoal[], 
    currentProgress: ProgressMetrics
  ): Promise<AgentRecommendation[]> {
    try {
      const recommendations: AgentRecommendation[] = [];

      // Analyze which agents best match learning goals
      const agentMatches = this.matchAgentsToGoals(learningGoals, currentProgress);

      for (const [agentId, matchData] of agentMatches) {
        const agentInfo = this.getAgentInfo(agentId);
        
        recommendations.push({
          agentId,
          agentName: agentInfo.name,
          matchScore: matchData.score,
          reason: matchData.reason,
          specialties: agentInfo.specialties,
          recommendedFor: matchData.goals
        });
      }

      // Sort by match score
      recommendations.sort((a, b) => b.matchScore - a.matchScore);

      return recommendations.slice(0, 3); // Top 3 agent recommendations

    } catch (error) {
      console.error('Error recommending agents:', error);
      return this.getFallbackAgentRecommendations();
    }
  }

  /**
   * Recommend difficulty level based on recent performance
   */
  async recommendDifficulty(
    userProfile: UserProfile, 
    recentSessions: ConversationSession[]
  ): Promise<DifficultyRecommendation> {
    try {
      if (recentSessions.length === 0) {
        return this.getDefaultDifficultyRecommendation(userProfile.currentLevel);
      }

      // Calculate adjustment factors
      const recentPerformance = this.calculateRecentPerformance(recentSessions);
      const userLevelFactor = this.getUserLevelFactor(userProfile.currentLevel);
      const sessionFrequency = this.calculateSessionFrequency(recentSessions);
      const errorRate = this.calculateErrorRate(recentSessions);

      const adjustmentFactors = {
        recentPerformance,
        userLevel: userLevelFactor,
        sessionFrequency,
        errorRate
      };

      // Use Bedrock for intelligent difficulty recommendation
      const bedrockRecommendation = await this.getBedrockDifficultyRecommendation(
        userProfile,
        adjustmentFactors,
        recentSessions
      );

      return bedrockRecommendation;

    } catch (error) {
      console.error('Error recommending difficulty:', error);
      return this.getDefaultDifficultyRecommendation(userProfile.currentLevel);
    }
  }

  /**
   * Generate comprehensive session recommendations
   */
  async generateSessionRecommendations(
    userProfile: UserProfile, 
    sessionHistory: ConversationSession[]
  ): Promise<SessionRecommendation> {
    try {
      // Get individual recommendations
      const [topics, agents, difficulty] = await Promise.all([
        this.recommendTopics(userProfile, sessionHistory),
        this.recommendAgents(userProfile.learningGoals, userProfile.progressMetrics),
        this.recommendDifficulty(userProfile, sessionHistory.slice(0, 5))
      ]);

      // Determine optimal session length
      const sessionLength = this.recommendSessionLength(userProfile, sessionHistory);

      // Identify focus areas based on progress
      const focusAreas = this.identifyFocusAreas(userProfile.progressMetrics, userProfile.learningGoals);

      // Generate motivational message
      const motivationalMessage = await this.generateMotivationalMessage(userProfile, sessionHistory);

      return {
        topics,
        agents,
        difficulty,
        sessionLength,
        focusAreas,
        motivationalMessage
      };

    } catch (error) {
      console.error('Error generating session recommendations:', error);
      throw new Error(`Failed to generate session recommendations: ${error}`);
    }
  }

  /**
   * Adapt recommendations based on user feedback
   */
  async adaptToFeedback(userId: string, feedback: UserFeedback): Promise<void> {
    try {
      // Store feedback for future recommendations
      const userFeedback = this.userFeedbackHistory.get(userId) || [];
      userFeedback.push(feedback);
      this.userFeedbackHistory.set(userId, userFeedback);

      // Analyze feedback patterns
      const feedbackAnalysis = this.analyzeFeedbackPatterns(userFeedback);

      // Update recommendation weights based on feedback
      await this.updateRecommendationWeights(userId, feedbackAnalysis);

    } catch (error) {
      console.error('Error adapting to feedback:', error);
      throw new Error(`Failed to adapt to feedback: ${error}`);
    }
  }

  /**
   * Private helper methods
   */

  private analyzeTopicPerformance(sessionHistory: ConversationSession[]): Map<string, number> {
    const topicPerformance = new Map<string, number>();

    sessionHistory.forEach(session => {
      const topic = session.topic;
      const performance = (
        (session.performanceMetrics?.grammarAccuracy || 0) +
        (session.performanceMetrics?.fluencyScore || 0)
      ) / 2;

      const currentAvg = topicPerformance.get(topic) || 0;
      const sessionCount = sessionHistory.filter(s => s.topic === topic).length;
      const newAvg = (currentAvg * (sessionCount - 1) + performance) / sessionCount;
      
      topicPerformance.set(topic, newAvg);
    });

    return topicPerformance;
  }

  private getRecentTopics(sessionHistory: ConversationSession[], count: number): string[] {
    return sessionHistory
      .slice(0, count)
      .map(session => session.topic);
  }

  private async getBedrockTopicRecommendations(
    userProfile: UserProfile,
    topicPerformance: Map<string, number>,
    recentTopics: string[]
  ): Promise<TopicRecommendation[]> {
    try {
      const prompt = this.buildTopicRecommendationPrompt(userProfile, topicPerformance, recentTopics);
      
      const response = await this.bedrockClient.invokeModel(
        'You are a language learning expert providing topic recommendations.',
        prompt,
        {
          sessionId: 'recommendation-session',
          userId: userProfile.userId,
          conversationHistory: [],
          userProfile: {
            languageLevel: userProfile.currentLevel,
            targetLanguage: userProfile.targetLanguage,
            learningGoals: userProfile.learningGoals
          }
        }
      );

      return this.parseTopicRecommendations(response.content);

    } catch (error) {
      console.error('Error getting Bedrock topic recommendations:', error);
      return [];
    }
  }

  private getRuleBasedTopicRecommendations(
    userProfile: UserProfile,
    recentTopics: string[]
  ): TopicRecommendation[] {
    const recommendations: TopicRecommendation[] = [];
    const availableTopics = [...CONVERSATION_TOPICS].filter((topic: string) => !recentTopics.includes(topic));

    // Recommend based on learning goals
    userProfile.learningGoals.forEach(goal => {
      const topicsForGoal = this.getTopicsForLearningGoal(goal);
      topicsForGoal.forEach(topic => {
        if (availableTopics.includes(topic as any)) {
          recommendations.push({
            topic,
            relevanceScore: 0.7,
            difficulty: this.getDifficultyForTopic(topic, userProfile.currentLevel),
            reason: `Recommended for ${goal} practice`,
            estimatedDuration: 15
          });
        }
      });
    });

    return recommendations;
  }

  private matchAgentsToGoals(
    learningGoals: LearningGoal[], 
    currentProgress: ProgressMetrics
  ): Map<string, { score: number; reason: string; goals: LearningGoal[] }> {
    const matches = new Map();

    // Define agent specialties
    const agentSpecialties = {
      [AGENT_PERSONALITIES.FRIENDLY_TUTOR]: {
        goals: ['confidence-building', 'conversation-fluency'],
        strengths: ['encouragement', 'general conversation'],
        score: 0.8
      },
      [AGENT_PERSONALITIES.STRICT_TEACHER]: {
        goals: ['grammar-accuracy'],
        strengths: ['grammar correction', 'structured learning'],
        score: 0.9
      },
      [AGENT_PERSONALITIES.CONVERSATION_PARTNER]: {
        goals: ['conversation-fluency', 'confidence-building'],
        strengths: ['natural conversation', 'cultural topics'],
        score: 0.85
      },
      [AGENT_PERSONALITIES.PRONUNCIATION_COACH]: {
        goals: ['pronunciation-improvement'],
        strengths: ['pronunciation', 'phonetics'],
        score: 0.95
      }
    };

    // Match agents to user's learning goals
    Object.entries(agentSpecialties).forEach(([agentId, specialty]) => {
      const matchingGoals = learningGoals.filter(goal => specialty.goals.includes(goal));
      
      if (matchingGoals.length > 0) {
        const baseScore = specialty.score;
        const goalMatchRatio = matchingGoals.length / learningGoals.length;
        const finalScore = baseScore * (0.7 + goalMatchRatio * 0.3);

        matches.set(agentId, {
          score: finalScore,
          reason: `Specializes in ${specialty.strengths.join(' and ')}`,
          goals: matchingGoals
        });
      }
    });

    return matches;
  }

  private getAgentInfo(agentId: string): { name: string; specialties: string[] } {
    const agentInfo: Record<string, { name: string; specialties: string[] }> = {
      [AGENT_PERSONALITIES.FRIENDLY_TUTOR]: {
        name: 'Maya - Friendly Tutor',
        specialties: ['General conversation', 'Confidence building', 'Encouragement']
      },
      [AGENT_PERSONALITIES.STRICT_TEACHER]: {
        name: 'Professor Chen - Grammar Expert',
        specialties: ['Grammar correction', 'Structured learning', 'Academic language']
      },
      [AGENT_PERSONALITIES.CONVERSATION_PARTNER]: {
        name: 'Alex - Conversation Partner',
        specialties: ['Natural conversation', 'Cultural topics', 'Casual language']
      },
      [AGENT_PERSONALITIES.PRONUNCIATION_COACH]: {
        name: 'Dr. Rodriguez - Pronunciation Coach',
        specialties: ['Pronunciation', 'Phonetics', 'Accent reduction']
      }
    };

    return agentInfo[agentId] || { name: 'Unknown Agent', specialties: [] };
  }

  private calculateRecentPerformance(recentSessions: ConversationSession[]): number {
    if (recentSessions.length === 0) return 0.5;

    const totalScore = recentSessions.reduce((sum, session) => {
      const metrics = session.performanceMetrics;
      const sessionScore = (
        (metrics?.grammarAccuracy || 0) +
        (metrics?.fluencyScore || 0)
      ) / 2;
      return sum + sessionScore;
    }, 0);

    return totalScore / recentSessions.length;
  }

  private getUserLevelFactor(level: LanguageLevel): number {
    const levelFactors = {
      'beginner': 0.2,
      'elementary': 0.35,
      'intermediate': 0.5,
      'upper-intermediate': 0.65,
      'advanced': 0.8,
      'proficient': 0.95
    };

    return levelFactors[level] || 0.5;
  }

  private calculateSessionFrequency(recentSessions: ConversationSession[]): number {
    if (recentSessions.length === 0) return 0;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentSessionCount = recentSessions.filter(session => 
      new Date(session.startTime) > weekAgo
    ).length;

    return Math.min(1, recentSessionCount / 7); // Normalize to 0-1
  }

  private calculateErrorRate(recentSessions: ConversationSession[]): number {
    if (recentSessions.length === 0) return 0.5;

    const totalErrors = recentSessions.reduce((sum, session) => 
      sum + (session.performanceMetrics?.errorsCount || 0), 0);
    
    const totalWords = recentSessions.reduce((sum, session) => 
      sum + (session.performanceMetrics?.wordsSpoken || 0), 0);

    return totalWords > 0 ? totalErrors / totalWords : 0.5;
  }

  private async getBedrockDifficultyRecommendation(
    userProfile: UserProfile,
    adjustmentFactors: any,
    recentSessions: ConversationSession[]
  ): Promise<DifficultyRecommendation> {
    try {
      const prompt = this.buildDifficultyRecommendationPrompt(userProfile, adjustmentFactors, recentSessions);
      
      const response = await this.bedrockClient.invokeModel(
        'You are a language learning expert providing difficulty recommendations.',
        prompt,
        {
          sessionId: 'recommendation-session',
          userId: userProfile.userId,
          conversationHistory: [],
          userProfile: {
            languageLevel: userProfile.currentLevel,
            targetLanguage: userProfile.targetLanguage,
            learningGoals: userProfile.learningGoals
          }
        }
      );

      return this.parseDifficultyRecommendation(response.content, adjustmentFactors);

    } catch (error) {
      console.error('Error getting Bedrock difficulty recommendation:', error);
      return this.getDefaultDifficultyRecommendation(userProfile.currentLevel);
    }
  }

  private recommendSessionLength(userProfile: UserProfile, sessionHistory: ConversationSession[]): number {
    // Base session length on user level and recent session performance
    const baseLengths = {
      'beginner': 10,
      'elementary': 15,
      'intermediate': 20,
      'upper-intermediate': 25,
      'advanced': 30,
      'proficient': 35
    };

    let recommendedLength = baseLengths[userProfile.currentLevel] || 20;

    // Adjust based on recent session completion rates
    if (sessionHistory.length > 0) {
      const recentSessions = sessionHistory.slice(0, 5);
      const avgCompletionRate = recentSessions.reduce((sum, session) => {
        const planned = 20; // Assume 20 minutes planned
        const actual = (session.performanceMetrics?.duration || 0) / 60000; // Convert to minutes
        return sum + Math.min(1, actual / planned);
      }, 0) / recentSessions.length;

      // Adjust length based on completion rate
      if (avgCompletionRate > 0.9) {
        recommendedLength += 5; // Increase if user consistently completes sessions
      } else if (avgCompletionRate < 0.6) {
        recommendedLength -= 5; // Decrease if user often doesn't complete sessions
      }
    }

    return Math.max(10, Math.min(45, recommendedLength)); // Clamp between 10-45 minutes
  }

  private identifyFocusAreas(progressMetrics: ProgressMetrics, learningGoals: LearningGoal[]): LearningGoal[] {
    const focusAreas: LearningGoal[] = [];

    // Identify areas that need improvement
    if (progressMetrics.grammarProgress < 0.7) {
      focusAreas.push('grammar-accuracy');
    }
    if (progressMetrics.fluencyProgress < 0.7) {
      focusAreas.push('conversation-fluency');
    }
    if (progressMetrics.vocabularyGrowth < 0.6) {
      focusAreas.push('vocabulary-expansion');
    }
    if (progressMetrics.confidenceLevel < 0.6) {
      focusAreas.push('confidence-building');
    }

    // If no specific areas need improvement, focus on user's stated goals
    if (focusAreas.length === 0) {
      focusAreas.push(...learningGoals.slice(0, 2));
    }

    return focusAreas.slice(0, 3); // Limit to 3 focus areas
  }

  private async generateMotivationalMessage(
    userProfile: UserProfile, 
    sessionHistory: ConversationSession[]
  ): Promise<string> {
    try {
      const recentProgress = sessionHistory.length > 0 ? 
        sessionHistory[0].performanceMetrics : null;

      const messages = [
        "Ready to continue your language journey? Let's make today's session count!",
        "Your consistency is paying off! Time for another great practice session.",
        "Every conversation brings you closer to fluency. Let's dive in!",
        "You're making excellent progress! Ready to challenge yourself today?",
        "Practice makes perfect, and you're doing amazing! Let's continue."
      ];

      // Customize based on recent performance
      if (recentProgress && recentProgress.grammarAccuracy > 0.8) {
        return "Your grammar has been spot-on lately! Ready to tackle some new challenges?";
      }
      if (recentProgress && recentProgress.fluencyScore > 0.8) {
        return "Your fluency is really improving! Let's keep the momentum going.";
      }
      if (userProfile.progressMetrics.streakDays > 5) {
        return `Amazing ${userProfile.progressMetrics.streakDays}-day streak! You're on fire! 🔥`;
      }

      return messages[Math.floor(Math.random() * messages.length)];

    } catch (error) {
      console.error('Error generating motivational message:', error);
      return "Ready for another great practice session? Let's get started!";
    }
  }

  private getTopicsForLearningGoal(goal: LearningGoal): string[] {
    const goalTopicMap = {
      'conversation-fluency': ['Travel and Culture', 'Family and Friends', 'Hobbies and Interests'],
      'grammar-accuracy': ['Work and Career', 'Education and Learning', 'Technology and Innovation'],
      'pronunciation-improvement': ['Food and Cooking', 'Health and Fitness', 'Entertainment and Media'],
      'vocabulary-expansion': ['Science and Discovery', 'Art and Creativity', 'Environment and Nature'],
      'confidence-building': ['Travel and Culture', 'Hobbies and Interests', 'Family and Friends']
    };

    return goalTopicMap[goal] || [];
  }

  private getDifficultyForTopic(topic: string, userLevel: LanguageLevel): 'easy' | 'medium' | 'hard' | 'adaptive' {
    // Simple mapping - in real implementation, this would be more sophisticated
    const complexTopics = ['Technology and Innovation', 'Science and Discovery', 'History and Politics'];
    const easyTopics = ['Food and Cooking', 'Family and Friends', 'Hobbies and Interests'];

    if (complexTopics.includes(topic)) {
      return userLevel === 'beginner' || userLevel === 'elementary' ? 'hard' : 'medium';
    }
    if (easyTopics.includes(topic)) {
      return userLevel === 'advanced' || userLevel === 'proficient' ? 'easy' : 'medium';
    }

    return 'adaptive';
  }

  private rankTopicRecommendations(
    recommendations: TopicRecommendation[], 
    userProfile: UserProfile
  ): TopicRecommendation[] {
    return recommendations.sort((a, b) => {
      // Primary sort by relevance score
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Secondary sort by user's preferred topics
      const aPreferred = userProfile.conversationTopics.includes(a.topic) ? 1 : 0;
      const bPreferred = userProfile.conversationTopics.includes(b.topic) ? 1 : 0;
      
      return bPreferred - aPreferred;
    });
  }

  private getFallbackTopicRecommendations(userProfile: UserProfile): TopicRecommendation[] {
    const fallbackTopics = userProfile.conversationTopics.length > 0 ? 
      userProfile.conversationTopics : 
      ['Travel and Culture', 'Food and Cooking', 'Hobbies and Interests'];

    return fallbackTopics.slice(0, 3).map(topic => ({
      topic,
      relevanceScore: 0.6,
      difficulty: 'adaptive',
      reason: 'Based on your interests',
      estimatedDuration: 15
    }));
  }

  private getFallbackAgentRecommendations(): AgentRecommendation[] {
    return [{
      agentId: AGENT_PERSONALITIES.FRIENDLY_TUTOR,
      agentName: 'Maya - Friendly Tutor',
      matchScore: 0.7,
      reason: 'Great for general conversation practice',
      specialties: ['General conversation', 'Confidence building'],
      recommendedFor: ['conversation-fluency', 'confidence-building']
    }];
  }

  private getDefaultDifficultyRecommendation(level: LanguageLevel): DifficultyRecommendation {
    const difficultyMap = {
      'beginner': 'easy',
      'elementary': 'easy',
      'intermediate': 'medium',
      'upper-intermediate': 'medium',
      'advanced': 'hard',
      'proficient': 'hard'
    };

    return {
      recommendedDifficulty: difficultyMap[level] as any || 'medium',
      confidence: 0.7,
      reasoning: `Based on your ${level} level`,
      adjustmentFactors: {
        recentPerformance: 0.5,
        userLevel: this.getUserLevelFactor(level),
        sessionFrequency: 0.5,
        errorRate: 0.5
      }
    };
  }

  private buildTopicRecommendationPrompt(
    userProfile: UserProfile,
    topicPerformance: Map<string, number>,
    recentTopics: string[]
  ): string {
    return `
As a language learning expert, recommend 3 conversation topics for this student:

Student Profile:
- Level: ${userProfile.currentLevel}
- Learning Goals: ${userProfile.learningGoals.join(', ')}
- Preferred Topics: ${userProfile.conversationTopics.join(', ')}
- Recent Performance: ${userProfile.progressMetrics.overallImprovement}

Recent Topics: ${recentTopics.join(', ')}
Topic Performance: ${JSON.stringify(Object.fromEntries(topicPerformance))}

Available Topics: ${CONVERSATION_TOPICS.join(', ')}

Provide recommendations in JSON format:
[
  {
    "topic": "Topic Name",
    "relevanceScore": 0.85,
    "difficulty": "medium",
    "reason": "Why this topic is recommended",
    "estimatedDuration": 20
  }
]

Focus on variety, user interests, and appropriate challenge level.
`;
  }

  private buildDifficultyRecommendationPrompt(
    userProfile: UserProfile,
    adjustmentFactors: any,
    recentSessions: ConversationSession[]
  ): string {
    return `
As a language learning expert, recommend the optimal difficulty level for this student's next session:

Student Profile:
- Level: ${userProfile.currentLevel}
- Recent Performance: ${adjustmentFactors.recentPerformance}
- Session Frequency: ${adjustmentFactors.sessionFrequency}
- Error Rate: ${adjustmentFactors.errorRate}

Recent Session Performance:
${recentSessions.slice(0, 3).map(s => `
- Grammar: ${s.performanceMetrics?.grammarAccuracy || 0}
- Fluency: ${s.performanceMetrics?.fluencyScore || 0}
- Errors: ${s.performanceMetrics?.errorsCount || 0}
`).join('')}

Provide recommendation in JSON format:
{
  "recommendedDifficulty": "easy|medium|hard|adaptive",
  "confidence": 0.85,
  "reasoning": "Explanation of the recommendation"
}

Consider the student's progress, consistency, and optimal challenge level.
`;
  }

  private parseTopicRecommendations(content: string): TopicRecommendation[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Error parsing topic recommendations:', error);
      return [];
    }
  }

  private parseDifficultyRecommendation(content: string, adjustmentFactors: any): DifficultyRecommendation {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          adjustmentFactors
        };
      }
    } catch (error) {
      console.error('Error parsing difficulty recommendation:', error);
    }

    return {
      recommendedDifficulty: 'medium',
      confidence: 0.5,
      reasoning: 'Default recommendation due to parsing error',
      adjustmentFactors
    };
  }

  private analyzeFeedbackPatterns(feedback: UserFeedback[]): any {
    if (feedback.length === 0) return {};

    const avgTopicRating = feedback.reduce((sum, f) => sum + f.topicRating, 0) / feedback.length;
    const avgAgentRating = feedback.reduce((sum, f) => sum + f.agentRating, 0) / feedback.length;
    const avgDifficultyRating = feedback.reduce((sum, f) => sum + f.difficultyRating, 0) / feedback.length;

    return {
      topicPreference: avgTopicRating,
      agentPreference: avgAgentRating,
      difficultyPreference: avgDifficultyRating,
      overallSatisfaction: feedback.reduce((sum, f) => sum + f.overallSatisfaction, 0) / feedback.length
    };
  }

  private async updateRecommendationWeights(userId: string, feedbackAnalysis: any): Promise<void> {
    // In a real implementation, this would update ML model weights or recommendation parameters
    // For now, we'll just log the feedback analysis
    console.log(`Updating recommendation weights for user ${userId}:`, feedbackAnalysis);
  }
}