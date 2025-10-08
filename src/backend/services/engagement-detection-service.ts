import { ConversationMessage, UserProfile } from '../../shared/types';

export interface EngagementSignals {
  responseLatency: number; // milliseconds
  messageComplexity: number; // 0-1 scale
  emotionalTone: 'positive' | 'neutral' | 'negative';
  participationLevel: 'high' | 'medium' | 'low';
  frustrationIndicators: string[];
  confidenceLevel: number; // 0-1 scale
}

export interface EngagementAnalysis {
  overallEngagement: number; // 0-100 scale
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: EngagementAction[];
  detectedPatterns: string[];
  interventionUrgency: 'none' | 'low' | 'medium' | 'high';
}

export interface EngagementAction {
  type: 'topic_change' | 'difficulty_adjust' | 'encouragement' | 'break_suggestion' | 'agent_switch';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImpact: number; // 0-1 scale
}

export class EngagementDetectionService {
  private readonly ENGAGEMENT_THRESHOLDS = {
    HIGH_ENGAGEMENT: 70,
    MEDIUM_ENGAGEMENT: 40,
    LOW_ENGAGEMENT: 25,
    CRITICAL_ENGAGEMENT: 15
  };

  private readonly RESPONSE_TIME_THRESHOLDS = {
    FAST: 3000,    // 3 seconds
    NORMAL: 8000,  // 8 seconds
    SLOW: 15000,   // 15 seconds
    VERY_SLOW: 30000 // 30 seconds
  };

  /**
   * Analyze user engagement based on conversation patterns
   */
  analyzeEngagement(
    conversationHistory: ConversationMessage[],
    userProfile: UserProfile,
    sessionDuration: number
  ): EngagementAnalysis {
    const signals = this.extractEngagementSignals(conversationHistory, sessionDuration);
    const overallEngagement = this.calculateOverallEngagement(signals, userProfile);
    const riskLevel = this.assessRiskLevel(overallEngagement, signals);
    const recommendedActions = this.generateRecommendedActions(signals, overallEngagement, userProfile);
    const detectedPatterns = this.identifyEngagementPatterns(conversationHistory, signals);
    const interventionUrgency = this.determineInterventionUrgency(overallEngagement, riskLevel, signals);

    return {
      overallEngagement,
      riskLevel,
      recommendedActions,
      detectedPatterns,
      interventionUrgency
    };
  }

  /**
   * Detect specific disengagement patterns
   */
  detectDisengagementPatterns(conversationHistory: ConversationMessage[]): {
    pattern: string;
    confidence: number;
    description: string;
  }[] {
    const patterns = [];
    const userMessages = conversationHistory.filter(msg => msg.sender === 'user');

    // Pattern 1: Decreasing message length over time
    if (this.isMessageLengthDecreasing(userMessages)) {
      patterns.push({
        pattern: 'decreasing_verbosity',
        confidence: 0.8,
        description: 'User responses are becoming shorter over time'
      });
    }

    // Pattern 2: Increasing response times
    if (this.isResponseTimeIncreasing(conversationHistory)) {
      patterns.push({
        pattern: 'increasing_latency',
        confidence: 0.7,
        description: 'User is taking longer to respond'
      });
    }

    // Pattern 3: Repetitive or minimal responses
    if (this.hasRepetitiveResponses(userMessages)) {
      patterns.push({
        pattern: 'repetitive_responses',
        confidence: 0.9,
        description: 'User is giving minimal or repetitive answers'
      });
    }

    // Pattern 4: Declining confidence scores
    if (this.isConfidenceDecreasing(userMessages)) {
      patterns.push({
        pattern: 'declining_confidence',
        confidence: 0.75,
        description: 'Speech recognition confidence is decreasing'
      });
    }

    // Pattern 5: Frustration keywords
    if (this.hasFrustrationKeywords(userMessages)) {
      patterns.push({
        pattern: 'frustration_indicators',
        confidence: 0.85,
        description: 'User is expressing frustration or confusion'
      });
    }

    return patterns;
  }

  /**
   * Generate personalized engagement interventions
   */
  generateEngagementInterventions(
    analysis: EngagementAnalysis,
    userProfile: UserProfile,
    currentTopic: string
  ): {
    immediate: EngagementAction[];
    shortTerm: EngagementAction[];
    longTerm: EngagementAction[];
  } {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];

    // Immediate interventions (within current conversation)
    if (analysis.interventionUrgency === 'high') {
      immediate.push({
        type: 'encouragement',
        priority: 'high',
        description: 'Provide immediate emotional support and encouragement',
        expectedImpact: 0.7
      });

      if (analysis.overallEngagement < this.ENGAGEMENT_THRESHOLDS.CRITICAL_ENGAGEMENT) {
        immediate.push({
          type: 'break_suggestion',
          priority: 'high',
          description: 'Suggest taking a short break to reset engagement',
          expectedImpact: 0.6
        });
      }
    }

    if (analysis.interventionUrgency === 'medium') {
      immediate.push({
        type: 'topic_change',
        priority: 'medium',
        description: `Switch to a topic from user's interests: ${userProfile.conversationTopics.join(', ')}`,
        expectedImpact: 0.5
      });
    }

    // Short-term interventions (next few messages)
    if (analysis.overallEngagement < this.ENGAGEMENT_THRESHOLDS.MEDIUM_ENGAGEMENT) {
      shortTerm.push({
        type: 'difficulty_adjust',
        priority: 'medium',
        description: 'Adjust conversation difficulty to match user comfort level',
        expectedImpact: 0.6
      });

      shortTerm.push({
        type: 'agent_switch',
        priority: 'low',
        description: 'Consider switching to a different agent personality',
        expectedImpact: 0.4
      });
    }

    // Long-term interventions (future sessions)
    if (analysis.detectedPatterns.includes('declining_performance')) {
      longTerm.push({
        type: 'difficulty_adjust',
        priority: 'medium',
        description: 'Recommend easier topics for upcoming sessions',
        expectedImpact: 0.5
      });
    }

    return { immediate, shortTerm, longTerm };
  }

  /**
   * Monitor engagement in real-time during conversation
   */
  monitorRealTimeEngagement(
    recentMessages: ConversationMessage[],
    timeWindow: number = 60000 // 1 minute
  ): {
    currentEngagement: number;
    trend: 'improving' | 'stable' | 'declining';
    alertLevel: 'none' | 'low' | 'medium' | 'high';
  } {
    const cutoffTime = Date.now() - timeWindow;
    const windowMessages = recentMessages.filter(
      msg => msg.timestamp.getTime() > cutoffTime
    );

    const signals = this.extractEngagementSignals(windowMessages, timeWindow / 1000);
    const currentEngagement = this.calculateOverallEngagement(signals);
    
    // Calculate trend by comparing with previous window
    const previousWindowStart = cutoffTime - timeWindow;
    const previousMessages = recentMessages.filter(
      msg => msg.timestamp.getTime() > previousWindowStart && msg.timestamp.getTime() <= cutoffTime
    );
    
    const previousSignals = this.extractEngagementSignals(previousMessages, timeWindow / 1000);
    const previousEngagement = this.calculateOverallEngagement(previousSignals);
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    const engagementDiff = currentEngagement - previousEngagement;
    
    if (engagementDiff > 10) trend = 'improving';
    else if (engagementDiff < -10) trend = 'declining';

    // Determine alert level
    let alertLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (currentEngagement < this.ENGAGEMENT_THRESHOLDS.CRITICAL_ENGAGEMENT) {
      alertLevel = 'high';
    } else if (currentEngagement < this.ENGAGEMENT_THRESHOLDS.LOW_ENGAGEMENT) {
      alertLevel = 'medium';
    } else if (trend === 'declining' && currentEngagement < this.ENGAGEMENT_THRESHOLDS.MEDIUM_ENGAGEMENT) {
      alertLevel = 'low';
    }

    return { currentEngagement, trend, alertLevel };
  }

  // Private helper methods

  private extractEngagementSignals(
    messages: ConversationMessage[],
    sessionDuration: number
  ): EngagementSignals {
    const userMessages = messages.filter(msg => msg.sender === 'user');
    
    if (userMessages.length === 0) {
      return {
        responseLatency: 0,
        messageComplexity: 0,
        emotionalTone: 'neutral',
        participationLevel: 'low',
        frustrationIndicators: [],
        confidenceLevel: 0
      };
    }

    const avgResponseLatency = this.calculateAverageResponseLatency(messages);
    const avgMessageComplexity = this.calculateAverageMessageComplexity(userMessages);
    const emotionalTone = this.analyzeEmotionalTone(userMessages);
    const participationLevel = this.assessParticipationLevel(userMessages, sessionDuration);
    const frustrationIndicators = this.detectFrustrationIndicators(userMessages);
    const avgConfidenceLevel = this.calculateAverageConfidence(userMessages);

    return {
      responseLatency: avgResponseLatency,
      messageComplexity: avgMessageComplexity,
      emotionalTone,
      participationLevel,
      frustrationIndicators,
      confidenceLevel: avgConfidenceLevel
    };
  }

  private calculateOverallEngagement(
    signals: EngagementSignals,
    userProfile?: UserProfile
  ): number {
    let score = 50; // baseline

    // Response latency impact (faster responses = higher engagement)
    if (signals.responseLatency < this.RESPONSE_TIME_THRESHOLDS.FAST) {
      score += 20;
    } else if (signals.responseLatency > this.RESPONSE_TIME_THRESHOLDS.SLOW) {
      score -= 20;
    } else if (signals.responseLatency > this.RESPONSE_TIME_THRESHOLDS.VERY_SLOW) {
      score -= 35;
    }

    // Message complexity impact
    score += signals.messageComplexity * 25;

    // Emotional tone impact
    switch (signals.emotionalTone) {
      case 'positive':
        score += 15;
        break;
      case 'negative':
        score -= 25;
        break;
    }

    // Participation level impact
    switch (signals.participationLevel) {
      case 'high':
        score += 20;
        break;
      case 'low':
        score -= 20;
        break;
    }

    // Frustration indicators impact
    score -= signals.frustrationIndicators.length * 10;

    // Confidence level impact
    score += (signals.confidenceLevel - 0.5) * 30;

    return Math.max(0, Math.min(100, score));
  }

  private assessRiskLevel(
    engagement: number,
    signals: EngagementSignals
  ): 'low' | 'medium' | 'high' {
    if (engagement < this.ENGAGEMENT_THRESHOLDS.CRITICAL_ENGAGEMENT ||
        signals.frustrationIndicators.length > 2) {
      return 'high';
    }
    
    if (engagement < this.ENGAGEMENT_THRESHOLDS.LOW_ENGAGEMENT ||
        signals.emotionalTone === 'negative') {
      return 'medium';
    }
    
    return 'low';
  }

  private generateRecommendedActions(
    signals: EngagementSignals,
    engagement: number,
    userProfile: UserProfile
  ): EngagementAction[] {
    const actions: EngagementAction[] = [];

    if (engagement < this.ENGAGEMENT_THRESHOLDS.LOW_ENGAGEMENT) {
      actions.push({
        type: 'encouragement',
        priority: 'high',
        description: 'Provide supportive feedback and encouragement',
        expectedImpact: 0.6
      });
    }

    if (signals.responseLatency > this.RESPONSE_TIME_THRESHOLDS.SLOW) {
      actions.push({
        type: 'difficulty_adjust',
        priority: 'medium',
        description: 'Reduce conversation complexity',
        expectedImpact: 0.5
      });
    }

    if (signals.frustrationIndicators.length > 0) {
      actions.push({
        type: 'topic_change',
        priority: 'high',
        description: 'Switch to a more comfortable topic',
        expectedImpact: 0.7
      });
    }

    if (signals.participationLevel === 'low') {
      actions.push({
        type: 'agent_switch',
        priority: 'medium',
        description: 'Try a different agent personality',
        expectedImpact: 0.4
      });
    }

    return actions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private identifyEngagementPatterns(
    messages: ConversationMessage[],
    signals: EngagementSignals
  ): string[] {
    const patterns = [];

    if (signals.responseLatency > this.RESPONSE_TIME_THRESHOLDS.SLOW) {
      patterns.push('slow_responses');
    }

    if (signals.messageComplexity < 0.3) {
      patterns.push('simple_responses');
    }

    if (signals.frustrationIndicators.length > 0) {
      patterns.push('frustration_detected');
    }

    if (signals.confidenceLevel < 0.5) {
      patterns.push('low_confidence');
    }

    return patterns;
  }

  private determineInterventionUrgency(
    engagement: number,
    riskLevel: 'low' | 'medium' | 'high',
    signals: EngagementSignals
  ): 'none' | 'low' | 'medium' | 'high' {
    if (riskLevel === 'high' || engagement < this.ENGAGEMENT_THRESHOLDS.CRITICAL_ENGAGEMENT) {
      return 'high';
    }

    if (riskLevel === 'medium' || signals.frustrationIndicators.length > 1) {
      return 'medium';
    }

    if (engagement < this.ENGAGEMENT_THRESHOLDS.MEDIUM_ENGAGEMENT) {
      return 'low';
    }

    return 'none';
  }

  // Pattern detection helper methods

  private isMessageLengthDecreasing(userMessages: ConversationMessage[]): boolean {
    if (userMessages.length < 3) return false;

    const lengths = userMessages.map(msg => msg.content.split(' ').length);
    const firstHalf = lengths.slice(0, Math.floor(lengths.length / 2));
    const secondHalf = lengths.slice(Math.floor(lengths.length / 2));

    const firstAvg = firstHalf.reduce((sum, len) => sum + len, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, len) => sum + len, 0) / secondHalf.length;

    return secondAvg < firstAvg * 0.7; // 30% decrease
  }

  private isResponseTimeIncreasing(messages: ConversationMessage[]): boolean {
    if (messages.length < 4) return false;

    const responseTimes = [];
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender === 'user' && messages[i-1].sender === 'agent') {
        const responseTime = messages[i].timestamp.getTime() - messages[i-1].timestamp.getTime();
        responseTimes.push(responseTime);
      }
    }

    if (responseTimes.length < 2) return false;

    const firstHalf = responseTimes.slice(0, Math.floor(responseTimes.length / 2));
    const secondHalf = responseTimes.slice(Math.floor(responseTimes.length / 2));

    const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;

    return secondAvg > firstAvg * 1.5; // 50% increase
  }

  private hasRepetitiveResponses(userMessages: ConversationMessage[]): boolean {
    if (userMessages.length < 3) return false;

    const recentMessages = userMessages.slice(-5);
    const shortResponses = recentMessages.filter(msg => 
      msg.content.split(' ').length <= 2
    );

    return shortResponses.length >= Math.min(3, recentMessages.length * 0.6);
  }

  private isConfidenceDecreasing(userMessages: ConversationMessage[]): boolean {
    if (userMessages.length < 3) return false;

    const confidenceScores = userMessages
      .filter(msg => msg.transcriptionConfidence !== undefined)
      .map(msg => msg.transcriptionConfidence!);

    if (confidenceScores.length < 3) return false;

    const firstHalf = confidenceScores.slice(0, Math.floor(confidenceScores.length / 2));
    const secondHalf = confidenceScores.slice(Math.floor(confidenceScores.length / 2));

    const firstAvg = firstHalf.reduce((sum, conf) => sum + conf, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, conf) => sum + conf, 0) / secondHalf.length;

    return secondAvg < firstAvg * 0.8; // 20% decrease
  }

  private hasFrustrationKeywords(userMessages: ConversationMessage[]): boolean {
    const frustrationKeywords = [
      'difficult', 'hard', 'confused', 'don\'t understand', 'can\'t',
      'frustrated', 'stuck', 'help', 'wrong', 'mistake', 'error'
    ];

    return userMessages.some(msg =>
      frustrationKeywords.some(keyword =>
        msg.content.toLowerCase().includes(keyword)
      )
    );
  }

  // Signal calculation helper methods

  private calculateAverageResponseLatency(messages: ConversationMessage[]): number {
    const responseTimes = [];
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender === 'user' && messages[i-1].sender === 'agent') {
        const responseTime = messages[i].timestamp.getTime() - messages[i-1].timestamp.getTime();
        responseTimes.push(responseTime);
      }
    }

    if (responseTimes.length === 0) return 5000; // default 5 seconds

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  private calculateAverageMessageComplexity(userMessages: ConversationMessage[]): number {
    if (userMessages.length === 0) return 0;

    const complexityScores = userMessages.map(msg => {
      const wordCount = msg.content.split(' ').length;
      const uniqueWords = new Set(msg.content.toLowerCase().split(' ')).size;
      const avgWordLength = msg.content.replace(/\s/g, '').length / wordCount;
      
      // Normalize to 0-1 scale
      const wordCountScore = Math.min(wordCount / 20, 1); // 20+ words = max score
      const uniquenessScore = uniqueWords / wordCount;
      const lengthScore = Math.min(avgWordLength / 6, 1); // 6+ char avg = max score
      
      return (wordCountScore + uniquenessScore + lengthScore) / 3;
    });

    return complexityScores.reduce((sum, score) => sum + score, 0) / complexityScores.length;
  }

  private analyzeEmotionalTone(userMessages: ConversationMessage[]): 'positive' | 'neutral' | 'negative' {
    const positiveKeywords = ['good', 'great', 'excellent', 'love', 'like', 'enjoy', 'happy', 'wonderful'];
    const negativeKeywords = ['bad', 'terrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'difficult'];

    let positiveCount = 0;
    let negativeCount = 0;

    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      positiveCount += positiveKeywords.filter(word => content.includes(word)).length;
      negativeCount += negativeKeywords.filter(word => content.includes(word)).length;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private assessParticipationLevel(
    userMessages: ConversationMessage[],
    sessionDuration: number
  ): 'high' | 'medium' | 'low' {
    const messagesPerMinute = (userMessages.length / sessionDuration) * 60;
    const avgWordsPerMessage = userMessages.reduce((sum, msg) => 
      sum + msg.content.split(' ').length, 0) / Math.max(userMessages.length, 1);

    if (messagesPerMinute > 2 && avgWordsPerMessage > 8) return 'high';
    if (messagesPerMinute > 1 && avgWordsPerMessage > 4) return 'medium';
    return 'low';
  }

  private detectFrustrationIndicators(userMessages: ConversationMessage[]): string[] {
    const indicators = [];
    const frustrationPatterns = [
      { pattern: /don'?t understand/i, indicator: 'comprehension_difficulty' },
      { pattern: /too (hard|difficult)/i, indicator: 'difficulty_complaint' },
      { pattern: /(confused|lost)/i, indicator: 'confusion_expressed' },
      { pattern: /(help|stuck)/i, indicator: 'help_requested' },
      { pattern: /(can'?t|cannot)/i, indicator: 'inability_expressed' }
    ];

    userMessages.forEach(msg => {
      frustrationPatterns.forEach(({ pattern, indicator }) => {
        if (pattern.test(msg.content) && !indicators.includes(indicator)) {
          indicators.push(indicator);
        }
      });
    });

    return indicators;
  }

  private calculateAverageConfidence(userMessages: ConversationMessage[]): number {
    const confidenceScores = userMessages
      .filter(msg => msg.transcriptionConfidence !== undefined)
      .map(msg => msg.transcriptionConfidence!);

    if (confidenceScores.length === 0) return 0.5; // default neutral confidence

    return confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length;
  }
}