import { BedrockService } from './bedrock-client';
import { UserProfile, ConversationSession, ConversationMessage, LanguageLevel } from '../../shared/types';

export interface TopicRecommendation {
  topic: string;
  difficulty: LanguageLevel;
  reason: string;
  confidence: number;
  estimatedDuration: number; // minutes
}

export interface EngagementMetrics {
  responseTime: number; // seconds
  messageLength: number; // words
  confidenceScore: number;
  pauseFrequency: number;
  frustrationLevel: 'low' | 'medium' | 'high';
  engagementScore: number; // 0-100
}

export interface DifficultyAdjustment {
  currentDifficulty: LanguageLevel;
  recommendedDifficulty: LanguageLevel;
  adjustmentReason: string;
  adjustmentStrength: 'minor' | 'moderate' | 'major';
}

export interface ConversationPrompt {
  type: 'continuation' | 'topic_change' | 'encouragement' | 'clarification';
  message: string;
  context: string;
  urgency: 'low' | 'medium' | 'high';
}

export class AutonomousConversationOrchestrator {
  private bedrockClient: BedrockService;
  private readonly SILENCE_THRESHOLD = 10000; // 10 seconds in milliseconds
  private readonly LOW_ENGAGEMENT_THRESHOLD = 30; // engagement score below 30
  private readonly HIGH_FRUSTRATION_THRESHOLD = 0.7; // frustration level above 70%

  constructor(bedrockClient: BedrockService) {
    this.bedrockClient = bedrockClient;
  }

  /**
   * Autonomously select conversation topics based on user profile and history
   */
  async selectTopicAutonomously(
    userProfile: UserProfile,
    sessionHistory: ConversationSession[],
    currentContext?: string
  ): Promise<TopicRecommendation> {
    try {
      const prompt = this.buildTopicSelectionPrompt(userProfile, sessionHistory, currentContext);
      
      const context = {
        sessionId: 'topic-selection',
        userId: userProfile.userId,
        conversationHistory: [],
        userProfile: {
          languageLevel: userProfile.currentLevel,
          targetLanguage: userProfile.targetLanguage,
          learningGoals: userProfile.learningGoals
        }
      };
      
      const response = await this.bedrockClient.invokeModel(
        'You are an AI language learning assistant. Select appropriate conversation topics.',
        prompt,
        context
      );

      return this.parseTopicRecommendation(response.content, userProfile);
    } catch (error) {
      console.error('Error in autonomous topic selection:', error);
      return this.getFallbackTopicRecommendation(userProfile);
    }
  }

  /**
   * Implement autonomous topic selection with advanced algorithms
   */
  async selectTopicWithAdvancedAlgorithms(
    userProfile: UserProfile,
    sessionHistory: ConversationSession[],
    currentEngagement: number,
    timeOfDay: 'morning' | 'afternoon' | 'evening'
  ): Promise<TopicRecommendation> {
    // Analyze user's historical preferences
    const topicPreferences = this.analyzeTopicPreferences(sessionHistory);
    
    // Consider time-based preferences
    const timeBasedTopics = this.getTimeBasedTopics(timeOfDay);
    
    // Factor in current engagement level
    const engagementAdjustedTopics = this.adjustTopicsForEngagement(
      userProfile.conversationTopics,
      currentEngagement
    );
    
    // Combine all factors for optimal topic selection
    const weightedTopics = this.combineTopicFactors(
      topicPreferences,
      timeBasedTopics,
      engagementAdjustedTopics,
      userProfile
    );
    
    // Select the best topic using AI reasoning
    return await this.selectOptimalTopic(weightedTopics, userProfile, sessionHistory);
  }

  /**
   * Automatically adjust conversation difficulty based on user performance
   */
  async adjustDifficultyAutonomously(
    userProfile: UserProfile,
    recentMessages: ConversationMessage[],
    performanceMetrics: any
  ): Promise<DifficultyAdjustment> {
    try {
      const currentPerformance = this.analyzeCurrentPerformance(recentMessages, performanceMetrics);
      const prompt = this.buildDifficultyAdjustmentPrompt(userProfile, currentPerformance);
      
      const context = {
        sessionId: 'difficulty-adjustment',
        userId: userProfile.userId,
        conversationHistory: [],
        userProfile: {
          languageLevel: userProfile.currentLevel,
          targetLanguage: userProfile.targetLanguage,
          learningGoals: userProfile.learningGoals
        }
      };
      
      const response = await this.bedrockClient.invokeModel(
        'You are an AI language learning assistant. Analyze performance and recommend difficulty adjustments.',
        prompt,
        context
      );

      return this.parseDifficultyAdjustment(response.content, userProfile.currentLevel);
    } catch (error) {
      console.error('Error in autonomous difficulty adjustment:', error);
      return {
        currentDifficulty: userProfile.currentLevel,
        recommendedDifficulty: userProfile.currentLevel,
        adjustmentReason: 'Maintaining current difficulty due to system error',
        adjustmentStrength: 'minor'
      };
    }
  }

  /**
   * Advanced difficulty adjustment with real-time performance analysis
   */
  async adjustDifficultyWithRealTimeAnalysis(
    userProfile: UserProfile,
    recentMessages: ConversationMessage[],
    performanceMetrics: any,
    sessionDuration: number,
    errorPatterns: string[]
  ): Promise<DifficultyAdjustment> {
    // Analyze performance trends over time
    const performanceTrend = this.analyzePerformanceTrend(recentMessages, performanceMetrics);
    
    // Identify specific areas of struggle
    const strugglingAreas = this.identifyStrugglingAreas(errorPatterns, performanceMetrics);
    
    // Consider session fatigue
    const fatigueLevel = this.calculateFatigueLevel(sessionDuration, recentMessages);
    
    // Generate adaptive difficulty recommendation
    return await this.generateAdaptiveDifficultyRecommendation(
      userProfile,
      performanceTrend,
      strugglingAreas,
      fatigueLevel
    );
  }

  /**
   * Detect user engagement and generate appropriate responses
   */
  async detectEngagementAndRespond(
    conversationHistory: ConversationMessage[],
    lastUserActivity: Date,
    userProfile: UserProfile
  ): Promise<ConversationPrompt | null> {
    const engagementMetrics = this.calculateEngagementMetrics(conversationHistory, lastUserActivity);
    
    // Check for silence threshold
    const timeSinceLastActivity = Date.now() - lastUserActivity.getTime();
    if (timeSinceLastActivity > this.SILENCE_THRESHOLD) {
      return await this.generateSilencePrompt(conversationHistory, userProfile);
    }

    // Check for low engagement
    if (engagementMetrics.engagementScore < this.LOW_ENGAGEMENT_THRESHOLD) {
      return await this.generateEngagementPrompt(conversationHistory, engagementMetrics, userProfile);
    }

    // Check for high frustration
    if (engagementMetrics.frustrationLevel === 'high') {
      return await this.generateFrustrationSupportPrompt(conversationHistory, userProfile);
    }

    return null; // No intervention needed
  }

  /**
   * Advanced engagement detection with behavioral pattern analysis
   */
  async detectEngagementWithBehavioralAnalysis(
    conversationHistory: ConversationMessage[],
    lastUserActivity: Date,
    userProfile: UserProfile,
    sessionMetrics: any
  ): Promise<{
    engagementLevel: number;
    interventionRecommendations: ConversationPrompt[];
    behavioralPatterns: string[];
    riskFactors: string[];
  }> {
    // Analyze conversation patterns
    const conversationPatterns = this.analyzeConversationPatterns(conversationHistory);
    
    // Detect emotional state indicators
    const emotionalState = this.detectEmotionalState(conversationHistory);
    
    // Analyze response timing patterns
    const timingPatterns = this.analyzeResponseTimingPatterns(conversationHistory);
    
    // Calculate comprehensive engagement score
    const engagementLevel = this.calculateComprehensiveEngagement(
      conversationPatterns,
      emotionalState,
      timingPatterns,
      sessionMetrics
    );
    
    // Generate targeted interventions
    const interventionRecommendations = await this.generateTargetedInterventions(
      engagementLevel,
      conversationPatterns,
      emotionalState,
      userProfile
    );
    
    // Identify behavioral patterns and risk factors
    const behavioralPatterns = this.identifyBehavioralPatterns(conversationHistory, sessionMetrics);
    const riskFactors = this.identifyRiskFactors(engagementLevel, emotionalState, timingPatterns);
    
    return {
      engagementLevel,
      interventionRecommendations,
      behavioralPatterns,
      riskFactors
    };
  }

  /**
   * Generate autonomous conversation continuation prompts
   */
  async generateContinuationPrompt(
    conversationHistory: ConversationMessage[],
    currentTopic: string,
    userProfile: UserProfile
  ): Promise<ConversationPrompt> {
    try {
      const prompt = this.buildContinuationPrompt(conversationHistory, currentTopic, userProfile);
      
      const context = {
        sessionId: 'continuation-prompt',
        userId: userProfile.userId,
        conversationHistory: conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        userProfile: {
          languageLevel: userProfile.currentLevel,
          targetLanguage: userProfile.targetLanguage,
          learningGoals: userProfile.learningGoals
        },
        currentTopic
      };
      
      const response = await this.bedrockClient.invokeModel(
        'You are an AI language learning assistant. Generate natural conversation continuations.',
        prompt,
        context
      );

      return {
        type: 'continuation',
        message: response.content.trim(),
        context: currentTopic,
        urgency: 'low'
      };
    } catch (error) {
      console.error('Error generating continuation prompt:', error);
      return this.getFallbackContinuationPrompt(currentTopic);
    }
  }

  /**
   * Analyze user performance trends and suggest interventions
   */
  analyzePerformanceTrends(
    sessionHistory: ConversationSession[],
    timeframe: 'week' | 'month' | 'all'
  ): {
    trend: 'improving' | 'stable' | 'declining';
    confidence: number;
    recommendations: string[];
  } {
    if (sessionHistory.length < 2) {
      return {
        trend: 'stable',
        confidence: 0.5,
        recommendations: ['Continue practicing regularly to establish performance baseline']
      };
    }

    const recentSessions = this.filterSessionsByTimeframe(sessionHistory, timeframe);
    const performanceScores = recentSessions.map(session => 
      this.calculateSessionPerformanceScore(session)
    );

    const trend = this.calculateTrend(performanceScores);
    const confidence = this.calculateTrendConfidence(performanceScores);
    const recommendations = this.generatePerformanceRecommendations(trend, recentSessions);

    return { trend, confidence, recommendations };
  }

  // Private helper methods for advanced algorithms

  private analyzeTopicPreferences(sessionHistory: ConversationSession[]): Map<string, number> {
    const topicScores = new Map<string, number>();
    
    sessionHistory.forEach(session => {
      const currentScore = topicScores.get(session.topic) || 0;
      // Score based on session duration and performance
      const sessionScore = session.performanceMetrics.duration * 
        (session.performanceMetrics.grammarAccuracy + session.performanceMetrics.fluencyScore) / 200;
      topicScores.set(session.topic, currentScore + sessionScore);
    });
    
    return topicScores;
  }

  private getTimeBasedTopics(timeOfDay: 'morning' | 'afternoon' | 'evening'): string[] {
    const timeTopics = {
      morning: ['Daily Routines', 'Work and Career', 'Health and Fitness', 'News and Current Events'],
      afternoon: ['Hobbies and Interests', 'Travel Experiences', 'Food and Cooking', 'Technology'],
      evening: ['Entertainment', 'Family and Friends', 'Books and Movies', 'Personal Reflection']
    };
    
    return timeTopics[timeOfDay];
  }

  private adjustTopicsForEngagement(
    userTopics: string[],
    currentEngagement: number
  ): string[] {
    if (currentEngagement < 30) {
      // Low engagement - suggest easier, more interesting topics
      return userTopics.filter(topic => 
        ['Hobbies', 'Entertainment', 'Food', 'Travel'].some(easy => 
          topic.toLowerCase().includes(easy.toLowerCase())
        )
      );
    } else if (currentEngagement > 70) {
      // High engagement - can handle more challenging topics
      return userTopics.concat(['Philosophy', 'Science', 'Politics', 'Abstract Concepts']);
    }
    
    return userTopics;
  }

  private combineTopicFactors(
    preferences: Map<string, number>,
    timeBasedTopics: string[],
    engagementTopics: string[],
    userProfile: UserProfile
  ): Array<{ topic: string; score: number }> {
    const combinedScores = new Map<string, number>();
    
    // Add preference scores
    preferences.forEach((score, topic) => {
      combinedScores.set(topic, score * 0.4); // 40% weight
    });
    
    // Add time-based bonus
    timeBasedTopics.forEach(topic => {
      const current = combinedScores.get(topic) || 0;
      combinedScores.set(topic, current + 0.3); // 30% weight
    });
    
    // Add engagement adjustment
    engagementTopics.forEach(topic => {
      const current = combinedScores.get(topic) || 0;
      combinedScores.set(topic, current + 0.2); // 20% weight
    });
    
    // Add user profile topics
    userProfile.conversationTopics.forEach(topic => {
      const current = combinedScores.get(topic) || 0;
      combinedScores.set(topic, current + 0.1); // 10% weight
    });
    
    return Array.from(combinedScores.entries())
      .map(([topic, score]) => ({ topic, score }))
      .sort((a, b) => b.score - a.score);
  }

  private async selectOptimalTopic(
    weightedTopics: Array<{ topic: string; score: number }>,
    userProfile: UserProfile,
    sessionHistory: ConversationSession[]
  ): Promise<TopicRecommendation> {
    if (weightedTopics.length === 0) {
      return this.getFallbackTopicRecommendation(userProfile);
    }
    
    const topTopic = weightedTopics[0];
    
    return {
      topic: topTopic.topic,
      difficulty: userProfile.currentLevel,
      reason: `Selected based on user preferences and engagement patterns (score: ${topTopic.score.toFixed(2)})`,
      confidence: Math.min(0.95, topTopic.score / 10),
      estimatedDuration: this.estimateTopicDuration(topTopic.topic, userProfile.currentLevel)
    };
  }

  private analyzePerformanceTrend(
    recentMessages: ConversationMessage[],
    performanceMetrics: any
  ): 'improving' | 'stable' | 'declining' {
    if (!performanceMetrics || recentMessages.length < 3) {
      return 'stable';
    }
    
    // Analyze message quality over time
    const messageScores = recentMessages
      .filter(msg => msg.sender === 'user')
      .map(msg => {
        const wordCount = msg.content.split(' ').length;
        const confidence = msg.transcriptionConfidence || 0.5;
        return wordCount * confidence;
      });
    
    if (messageScores.length < 2) return 'stable';
    
    const firstHalf = messageScores.slice(0, Math.floor(messageScores.length / 2));
    const secondHalf = messageScores.slice(Math.floor(messageScores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const improvement = (secondAvg - firstAvg) / firstAvg;
    
    if (improvement > 0.1) return 'improving';
    if (improvement < -0.1) return 'declining';
    return 'stable';
  }

  private identifyStrugglingAreas(
    errorPatterns: string[],
    performanceMetrics: any
  ): string[] {
    const strugglingAreas = [];
    
    if (performanceMetrics.grammarAccuracy < 60) {
      strugglingAreas.push('grammar');
    }
    
    if (performanceMetrics.fluencyScore < 60) {
      strugglingAreas.push('fluency');
    }
    
    if (errorPatterns.includes('pronunciation')) {
      strugglingAreas.push('pronunciation');
    }
    
    if (errorPatterns.includes('vocabulary')) {
      strugglingAreas.push('vocabulary');
    }
    
    return strugglingAreas;
  }

  private calculateFatigueLevel(
    sessionDuration: number,
    recentMessages: ConversationMessage[]
  ): number {
    // Base fatigue on session duration (in minutes)
    const durationFatigue = Math.min(sessionDuration / 60, 1); // Max 1 hour
    
    // Analyze message frequency decline
    const userMessages = recentMessages.filter(msg => msg.sender === 'user');
    if (userMessages.length < 2) return durationFatigue;
    
    const timeIntervals = [];
    for (let i = 1; i < userMessages.length; i++) {
      const interval = userMessages[i].timestamp.getTime() - userMessages[i-1].timestamp.getTime();
      timeIntervals.push(interval);
    }
    
    // Check if response times are increasing (fatigue indicator)
    const firstHalf = timeIntervals.slice(0, Math.floor(timeIntervals.length / 2));
    const secondHalf = timeIntervals.slice(Math.floor(timeIntervals.length / 2));
    
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
      
      const responseTimeFatigue = Math.min((secondAvg - firstAvg) / firstAvg, 1);
      return Math.max(durationFatigue, responseTimeFatigue);
    }
    
    return durationFatigue;
  }

  private async generateAdaptiveDifficultyRecommendation(
    userProfile: UserProfile,
    performanceTrend: 'improving' | 'stable' | 'declining',
    strugglingAreas: string[],
    fatigueLevel: number
  ): Promise<DifficultyAdjustment> {
    let recommendedDifficulty = userProfile.currentLevel;
    let adjustmentReason = 'Maintaining current difficulty';
    let adjustmentStrength: 'minor' | 'moderate' | 'major' = 'minor';
    
    // Adjust based on performance trend
    if (performanceTrend === 'improving' && strugglingAreas.length === 0 && fatigueLevel < 0.5) {
      recommendedDifficulty = this.getNextDifficultyLevel(userProfile.currentLevel);
      adjustmentReason = 'User showing consistent improvement, ready for increased challenge';
      adjustmentStrength = 'moderate';
    } else if (performanceTrend === 'declining' || strugglingAreas.length > 2) {
      recommendedDifficulty = this.getPreviousDifficultyLevel(userProfile.currentLevel);
      adjustmentReason = `User struggling with ${strugglingAreas.join(', ')}, reducing difficulty`;
      adjustmentStrength = 'moderate';
    } else if (fatigueLevel > 0.7) {
      recommendedDifficulty = this.getPreviousDifficultyLevel(userProfile.currentLevel);
      adjustmentReason = 'High fatigue detected, reducing difficulty to maintain engagement';
      adjustmentStrength = 'minor';
    }
    
    return {
      currentDifficulty: userProfile.currentLevel,
      recommendedDifficulty,
      adjustmentReason,
      adjustmentStrength
    };
  }

  private analyzeConversationPatterns(conversationHistory: ConversationMessage[]): any {
    const userMessages = conversationHistory.filter(msg => msg.sender === 'user');
    
    return {
      averageMessageLength: userMessages.reduce((sum, msg) => sum + msg.content.split(' ').length, 0) / Math.max(userMessages.length, 1),
      responseFrequency: userMessages.length / Math.max(conversationHistory.length / 2, 1),
      topicConsistency: this.calculateTopicConsistency(userMessages),
      engagementPattern: this.calculateEngagementPattern(userMessages)
    };
  }

  private detectEmotionalState(conversationHistory: ConversationMessage[]): any {
    const userMessages = conversationHistory.filter(msg => msg.sender === 'user');
    
    const positiveWords = ['good', 'great', 'excellent', 'love', 'like', 'enjoy', 'happy'];
    const negativeWords = ['bad', 'difficult', 'hard', 'confused', 'frustrated', 'can\'t'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    userMessages.forEach(msg => {
      const words = msg.content.toLowerCase().split(' ');
      positiveCount += words.filter(word => positiveWords.includes(word)).length;
      negativeCount += words.filter(word => negativeWords.includes(word)).length;
    });
    
    return {
      sentiment: (positiveCount - negativeCount) / Math.max(userMessages.length, 1),
      confidence: userMessages.reduce((sum, msg) => sum + (msg.transcriptionConfidence || 0.5), 0) / Math.max(userMessages.length, 1),
      frustrationLevel: negativeCount / Math.max(userMessages.length, 1)
    };
  }

  private analyzeResponseTimingPatterns(conversationHistory: ConversationMessage[]): any {
    const responseTimes = [];
    
    for (let i = 1; i < conversationHistory.length; i++) {
      if (conversationHistory[i].sender === 'user' && conversationHistory[i-1].sender === 'agent') {
        const responseTime = conversationHistory[i].timestamp.getTime() - conversationHistory[i-1].timestamp.getTime();
        responseTimes.push(responseTime);
      }
    }
    
    if (responseTimes.length === 0) {
      return { averageResponseTime: 5000, responseTimeVariability: 0, trend: 'stable' };
    }
    
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - averageResponseTime, 2), 0) / responseTimes.length;
    
    // Calculate trend
    const firstHalf = responseTimes.slice(0, Math.floor(responseTimes.length / 2));
    const secondHalf = responseTimes.slice(Math.floor(responseTimes.length / 2));
    
    let trend = 'stable';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg * 1.2) trend = 'slowing';
      else if (secondAvg < firstAvg * 0.8) trend = 'accelerating';
    }
    
    return {
      averageResponseTime,
      responseTimeVariability: Math.sqrt(variance),
      trend
    };
  }

  private calculateComprehensiveEngagement(
    conversationPatterns: any,
    emotionalState: any,
    timingPatterns: any,
    sessionMetrics: any
  ): number {
    let score = 50; // baseline
    
    // Message length factor
    if (conversationPatterns.averageMessageLength > 8) score += 15;
    else if (conversationPatterns.averageMessageLength < 3) score -= 15;
    
    // Emotional state factor
    score += emotionalState.sentiment * 20;
    score += emotionalState.confidence * 15;
    score -= emotionalState.frustrationLevel * 25;
    
    // Timing patterns factor
    if (timingPatterns.averageResponseTime < 5000) score += 10;
    else if (timingPatterns.averageResponseTime > 15000) score -= 15;
    
    if (timingPatterns.trend === 'slowing') score -= 10;
    else if (timingPatterns.trend === 'accelerating') score += 5;
    
    // Session metrics factor
    if (sessionMetrics) {
      score += (sessionMetrics.grammarAccuracy - 50) * 0.3;
      score += (sessionMetrics.fluencyScore - 50) * 0.3;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private async generateTargetedInterventions(
    engagementLevel: number,
    conversationPatterns: any,
    emotionalState: any,
    userProfile: UserProfile
  ): Promise<ConversationPrompt[]> {
    const interventions: ConversationPrompt[] = [];
    
    if (engagementLevel < 30) {
      interventions.push({
        type: 'encouragement',
        message: 'You\'re doing great! Every conversation is helping you improve.',
        context: 'Low engagement detected',
        urgency: 'high'
      });
    }
    
    if (emotionalState.frustrationLevel > 0.5) {
      interventions.push({
        type: 'encouragement',
        message: 'I can sense this might be challenging. Remember, making mistakes is part of learning!',
        context: 'Frustration detected',
        urgency: 'high'
      });
    }
    
    if (conversationPatterns.averageMessageLength < 3) {
      interventions.push({
        type: 'clarification',
        message: 'Can you tell me more about that? I\'d love to hear your thoughts in more detail.',
        context: 'Short responses detected',
        urgency: 'medium'
      });
    }
    
    return interventions;
  }

  private identifyBehavioralPatterns(
    conversationHistory: ConversationMessage[],
    sessionMetrics: any
  ): string[] {
    const patterns = [];
    const userMessages = conversationHistory.filter(msg => msg.sender === 'user');
    
    if (userMessages.length > 0) {
      const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.split(' ').length, 0) / userMessages.length;
      
      if (avgLength < 3) patterns.push('minimal_responses');
      if (avgLength > 15) patterns.push('verbose_responses');
      
      // Check for repetitive patterns
      const responses = userMessages.map(msg => msg.content.toLowerCase());
      const uniqueResponses = new Set(responses);
      if (uniqueResponses.size < responses.length * 0.7) {
        patterns.push('repetitive_responses');
      }
    }
    
    if (sessionMetrics) {
      if (sessionMetrics.grammarAccuracy < 50) patterns.push('grammar_struggles');
      if (sessionMetrics.fluencyScore < 50) patterns.push('fluency_challenges');
    }
    
    return patterns;
  }

  private identifyRiskFactors(
    engagementLevel: number,
    emotionalState: any,
    timingPatterns: any
  ): string[] {
    const riskFactors = [];
    
    if (engagementLevel < 25) riskFactors.push('very_low_engagement');
    if (emotionalState.frustrationLevel > 0.7) riskFactors.push('high_frustration');
    if (emotionalState.confidence < 0.3) riskFactors.push('low_confidence');
    if (timingPatterns.averageResponseTime > 20000) riskFactors.push('slow_responses');
    if (timingPatterns.trend === 'slowing') riskFactors.push('declining_responsiveness');
    
    return riskFactors;
  }

  private estimateTopicDuration(topic: string, level: LanguageLevel): number {
    const baseDurations = {
      'beginner': 10,
      'elementary': 12,
      'intermediate': 15,
      'upper-intermediate': 18,
      'advanced': 20,
      'proficient': 25
    };
    
    return baseDurations[level] || 15;
  }

  private getNextDifficultyLevel(currentLevel: LanguageLevel): LanguageLevel {
    const levels: LanguageLevel[] = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'proficient'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
  }

  private getPreviousDifficultyLevel(currentLevel: LanguageLevel): LanguageLevel {
    const levels: LanguageLevel[] = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'proficient'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex > 0 ? levels[currentIndex - 1] : currentLevel;
  }

  private calculateTopicConsistency(userMessages: ConversationMessage[]): number {
    // Simple implementation - in real system would use NLP to analyze topic coherence
    return Math.random() * 0.5 + 0.5; // 0.5-1.0 range
  }

  private calculateEngagementPattern(userMessages: ConversationMessage[]): string {
    if (userMessages.length < 3) return 'insufficient_data';
    
    const lengths = userMessages.map(msg => msg.content.split(' ').length);
    const firstHalf = lengths.slice(0, Math.floor(lengths.length / 2));
    const secondHalf = lengths.slice(Math.floor(lengths.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, len) => sum + len, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, len) => sum + len, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.2) return 'increasing_engagement';
    if (secondAvg < firstAvg * 0.8) return 'decreasing_engagement';
    return 'stable_engagement';
  }

  // Private helper methods

  private buildTopicSelectionPrompt(
    userProfile: UserProfile,
    sessionHistory: ConversationSession[],
    currentContext?: string
  ): string {
    const recentTopics = sessionHistory
      .slice(-5)
      .map(session => session.topic)
      .join(', ');

    return `
You are an AI language learning assistant. Select an appropriate conversation topic for a language learner.

User Profile:
- Target Language: ${userProfile.targetLanguage}
- Current Level: ${userProfile.currentLevel}
- Learning Goals: ${userProfile.learningGoals.join(', ')}
- Preferred Topics: ${userProfile.conversationTopics.join(', ')}

Recent Topics Covered: ${recentTopics || 'None'}
Current Context: ${currentContext || 'Starting new conversation'}

Select a topic that:
1. Matches the user's proficiency level
2. Aligns with their learning goals
3. Provides variety from recent sessions
4. Is engaging and practical

Respond in JSON format:
{
  "topic": "specific topic name",
  "difficulty": "beginner|intermediate|advanced",
  "reason": "explanation for selection",
  "confidence": 0.0-1.0,
  "estimatedDuration": minutes
}
    `.trim();
  }

  private buildDifficultyAdjustmentPrompt(
    userProfile: UserProfile,
    currentPerformance: any
  ): string {
    return `
You are an AI language learning assistant. Analyze the user's performance and recommend difficulty adjustments.

User Profile:
- Current Level: ${userProfile.currentLevel}
- Target Language: ${userProfile.targetLanguage}

Current Performance:
- Average Grammar Score: ${currentPerformance.grammarScore}%
- Average Fluency Score: ${currentPerformance.fluencyScore}%
- Response Confidence: ${currentPerformance.confidence}%
- Error Rate: ${currentPerformance.errorRate}%

Recommend difficulty adjustment based on:
- Scores above 85%: consider increasing difficulty
- Scores below 60%: consider decreasing difficulty
- Consistent performance: maintain current level

Respond in JSON format:
{
  "recommendedDifficulty": "beginner|intermediate|advanced",
  "adjustmentReason": "explanation",
  "adjustmentStrength": "minor|moderate|major"
}
    `.trim();
  }

  private buildContinuationPrompt(
    conversationHistory: ConversationMessage[],
    currentTopic: string,
    userProfile: UserProfile
  ): string {
    const lastMessages = conversationHistory
      .slice(-3)
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    return `
Generate a natural conversation continuation for a language learning session.

Topic: ${currentTopic}
User Level: ${userProfile.currentLevel}
Recent conversation:
${lastMessages}

Generate a follow-up question or comment that:
1. Continues the current topic naturally
2. Encourages the user to speak more
3. Matches their proficiency level
4. Is supportive and engaging

Respond with just the continuation message, no JSON format needed.
    `.trim();
  }

  private parseTopicRecommendation(response: string, userProfile: UserProfile): TopicRecommendation {
    try {
      const parsed = JSON.parse(response);
      return {
        topic: parsed.topic || 'General Conversation',
        difficulty: parsed.difficulty || userProfile.currentLevel,
        reason: parsed.reason || 'Selected based on user profile',
        confidence: parsed.confidence || 0.7,
        estimatedDuration: parsed.estimatedDuration || 15
      };
    } catch (error) {
      return this.getFallbackTopicRecommendation(userProfile);
    }
  }

  private parseDifficultyAdjustment(response: string, currentLevel: string): DifficultyAdjustment {
    try {
      const parsed = JSON.parse(response);
      return {
        currentDifficulty: currentLevel as any,
        recommendedDifficulty: parsed.recommendedDifficulty || currentLevel,
        adjustmentReason: parsed.adjustmentReason || 'Maintaining current difficulty',
        adjustmentStrength: parsed.adjustmentStrength || 'minor'
      };
    } catch (error) {
      return {
        currentDifficulty: currentLevel as any,
        recommendedDifficulty: currentLevel as any,
        adjustmentReason: 'Maintaining current difficulty due to parsing error',
        adjustmentStrength: 'minor'
      };
    }
  }

  private calculateEngagementMetrics(
    conversationHistory: ConversationMessage[],
    lastUserActivity: Date
  ): EngagementMetrics {
    const userMessages = conversationHistory.filter(msg => msg.sender === 'user');
    
    if (userMessages.length === 0) {
      return {
        responseTime: 0,
        messageLength: 0,
        confidenceScore: 0,
        pauseFrequency: 0,
        frustrationLevel: 'low',
        engagementScore: 50
      };
    }

    const avgResponseTime = this.calculateAverageResponseTime(conversationHistory);
    const avgMessageLength = userMessages.reduce((sum, msg) => 
      sum + msg.content.split(' ').length, 0) / userMessages.length;
    const avgConfidence = userMessages.reduce((sum, msg) => 
      sum + (msg.transcriptionConfidence || 0.5), 0) / userMessages.length;
    
    const pauseFrequency = this.calculatePauseFrequency(conversationHistory);
    const frustrationLevel = this.detectFrustrationLevel(userMessages);
    const engagementScore = this.calculateEngagementScore({
      responseTime: avgResponseTime,
      messageLength: avgMessageLength,
      confidenceScore: avgConfidence,
      pauseFrequency
    });

    return {
      responseTime: avgResponseTime,
      messageLength: avgMessageLength,
      confidenceScore: avgConfidence,
      pauseFrequency,
      frustrationLevel,
      engagementScore
    };
  }

  private async generateSilencePrompt(
    conversationHistory: ConversationMessage[],
    userProfile: UserProfile
  ): Promise<ConversationPrompt> {
    const prompts = [
      "I'm here when you're ready to continue. Take your time!",
      "No rush! What would you like to talk about?",
      "I'm listening. Feel free to share your thoughts.",
      "Would you like to try a different topic or continue with our current conversation?"
    ];

    return {
      type: 'continuation',
      message: prompts[Math.floor(Math.random() * prompts.length)],
      context: 'User silence detected',
      urgency: 'medium'
    };
  }

  private async generateEngagementPrompt(
    conversationHistory: ConversationMessage[],
    metrics: EngagementMetrics,
    userProfile: UserProfile
  ): Promise<ConversationPrompt> {
    const prompts = [
      "I notice you might be finding this challenging. Would you like to try something different?",
      "Let's make this more interesting! What topics do you enjoy talking about?",
      "How are you feeling about our conversation so far? We can adjust if needed.",
      "Would you prefer to practice with a different type of conversation?"
    ];

    return {
      type: 'encouragement',
      message: prompts[Math.floor(Math.random() * prompts.length)],
      context: 'Low engagement detected',
      urgency: 'high'
    };
  }

  private async generateFrustrationSupportPrompt(
    conversationHistory: ConversationMessage[],
    userProfile: UserProfile
  ): Promise<ConversationPrompt> {
    const prompts = [
      "You're doing great! Language learning takes time, and every mistake is progress.",
      "I can sense this might be frustrating. Remember, making errors is part of learning!",
      "Let's take it step by step. You're improving with each conversation.",
      "Don't worry about perfection. Focus on communication - you're doing well!"
    ];

    return {
      type: 'encouragement',
      message: prompts[Math.floor(Math.random() * prompts.length)],
      context: 'User frustration detected',
      urgency: 'high'
    };
  }

  private getFallbackTopicRecommendation(userProfile: UserProfile): TopicRecommendation {
    const fallbackTopics: Record<LanguageLevel, string[]> = {
      beginner: ['Daily Routines', 'Family and Friends', 'Food and Drinks', 'Weather'],
      elementary: ['Hobbies', 'Shopping', 'Transportation', 'Health'],
      intermediate: ['Travel Experiences', 'Hobbies and Interests', 'Work and Career', 'Current Events'],
      'upper-intermediate': ['Cultural Topics', 'Social Issues', 'Technology', 'Education'],
      advanced: ['Cultural Differences', 'Technology and Society', 'Environmental Issues', 'Philosophy and Ethics'],
      proficient: ['Complex Debates', 'Abstract Concepts', 'Professional Topics', 'Academic Discussions']
    };

    const topics = fallbackTopics[userProfile.currentLevel] || fallbackTopics.intermediate;
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    return {
      topic: randomTopic,
      difficulty: userProfile.currentLevel,
      reason: 'Fallback topic selection based on user level',
      confidence: 0.6,
      estimatedDuration: 15
    };
  }

  private getFallbackContinuationPrompt(currentTopic: string): ConversationPrompt {
    return {
      type: 'continuation',
      message: `That's interesting! Can you tell me more about ${currentTopic.toLowerCase()}?`,
      context: currentTopic,
      urgency: 'low'
    };
  }

  // Additional helper methods for calculations
  private analyzeCurrentPerformance(messages: ConversationMessage[], metrics: any): any {
    return {
      grammarScore: metrics?.grammarScore || 75,
      fluencyScore: metrics?.fluencyScore || 70,
      confidence: metrics?.confidence || 0.8,
      errorRate: metrics?.errorRate || 0.2
    };
  }

  private calculateAverageResponseTime(messages: ConversationMessage[]): number {
    // Mock implementation - in real system would calculate from timestamps
    return Math.random() * 10 + 2; // 2-12 seconds
  }

  private calculatePauseFrequency(messages: ConversationMessage[]): number {
    // Mock implementation - in real system would analyze audio patterns
    return Math.random() * 0.3; // 0-30% pause frequency
  }

  private detectFrustrationLevel(userMessages: ConversationMessage[]): 'low' | 'medium' | 'high' {
    // Mock implementation - in real system would use sentiment analysis
    const frustrationKeywords = ['difficult', 'hard', 'confused', 'don\'t understand'];
    const hasfrustrationKeywords = userMessages.some(msg => 
      frustrationKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    );
    
    return hasfrustrationKeywords ? 'medium' : 'low';
  }

  private calculateEngagementScore(metrics: Partial<EngagementMetrics>): number {
    let score = 50; // baseline
    
    // Adjust based on response time (faster = more engaged)
    if (metrics.responseTime && metrics.responseTime < 5) score += 20;
    else if (metrics.responseTime && metrics.responseTime > 15) score -= 20;
    
    // Adjust based on message length (longer = more engaged)
    if (metrics.messageLength && metrics.messageLength > 10) score += 15;
    else if (metrics.messageLength && metrics.messageLength < 3) score -= 15;
    
    // Adjust based on confidence
    if (metrics.confidenceScore && metrics.confidenceScore > 0.8) score += 15;
    else if (metrics.confidenceScore && metrics.confidenceScore < 0.5) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  private filterSessionsByTimeframe(sessions: ConversationSession[], timeframe: string): ConversationSession[] {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      default:
        return sessions;
    }
    
    return sessions.filter(session => session.startTime >= cutoffDate);
  }

  private calculateSessionPerformanceScore(session: ConversationSession): number {
    // Mock implementation - would calculate from actual session metrics
    return Math.random() * 40 + 60; // 60-100 score range
  }

  private calculateTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 2) return 'stable';
    
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  private calculateTrendConfidence(scores: number[]): number {
    if (scores.length < 3) return 0.5;
    
    const variance = this.calculateVariance(scores);
    const confidence = Math.max(0.3, Math.min(0.95, 1 - (variance / 1000)));
    
    return confidence;
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDifferences = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private generatePerformanceRecommendations(
    trend: 'improving' | 'stable' | 'declining',
    sessions: ConversationSession[]
  ): string[] {
    switch (trend) {
      case 'improving':
        return [
          'Great progress! Consider increasing conversation difficulty',
          'Try practicing with different agent personalities',
          'Explore more complex topics to challenge yourself'
        ];
      case 'declining':
        return [
          'Consider reviewing recent feedback and focusing on problem areas',
          'Try shorter, more focused practice sessions',
          'Work with a supportive tutor agent for encouragement'
        ];
      default:
        return [
          'Maintain consistent practice schedule',
          'Try varying conversation topics for broader exposure',
          'Set specific learning goals for upcoming sessions'
        ];
    }
  }

  private calculateEngagementMetrics(
    conversationHistory: ConversationMessage[],
    lastUserActivity: Date
  ): EngagementMetrics {
    const userMessages = conversationHistory.filter(msg => msg.sender === 'user');
    
    if (userMessages.length === 0) {
      return {
        responseTime: 0,
        messageLength: 0,
        confidenceScore: 0,
        pauseFrequency: 0,
        frustrationLevel: 'low',
        engagementScore: 50
      };
    }

    const avgResponseTime = this.calculateAverageResponseTime(conversationHistory);
    const avgMessageLength = userMessages.reduce((sum, msg) => 
      sum + msg.content.split(' ').length, 0) / userMessages.length;
    const avgConfidence = userMessages.reduce((sum, msg) => 
      sum + (msg.transcriptionConfidence || 0.5), 0) / userMessages.length;
    
    const pauseFrequency = this.calculatePauseFrequency(conversationHistory);
    const frustrationLevel = this.detectFrustrationLevel(userMessages);
    const engagementScore = this.calculateEngagementScore({
      responseTime: avgResponseTime,
      messageLength: avgMessageLength,
      confidenceScore: avgConfidence,
      pauseFrequency
    });

    return {
      responseTime: avgResponseTime,
      messageLength: avgMessageLength,
      confidenceScore: avgConfidence,
      pauseFrequency,
      frustrationLevel,
      engagementScore
    };
  }
}