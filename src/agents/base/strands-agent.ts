import { BedrockService, ConversationContext } from '@/backend/services/bedrock-client';
import { 
  AgentPersonality, 
  ConversationMessage, 
  LanguageAnalysis, 
  ProgressMetrics,
  UserProfile,
  FeedbackInstance,
  EmotionalState,
  FrustrationLevel,
  MotivationalMessage
} from '@/shared/types';

export interface AgentResponse {
  content: string;
  audioInstructions?: {
    voiceId: string;
    ssml?: string;
    emphasis?: string[];
  };
  feedback?: FeedbackInstance[];
  emotionalTone: 'encouraging' | 'neutral' | 'corrective' | 'enthusiastic';
  nextTopicSuggestion?: string;
}

export interface EmotionalState {
  frustrationLevel: number; // 0-1 scale
  confidenceLevel: number; // 0-1 scale
  engagementLevel: number; // 0-1 scale
  lastInteractionTime: Date;
}

export interface FrustrationLevel {
  level: number; // 0-1 scale
  indicators: string[];
  recommendedActions: string[];
}

export interface MotivationalMessage {
  message: string;
  type: 'encouragement' | 'milestone' | 'progress' | 'reassurance';
  personalizedElements: string[];
}

export abstract class StrandsAgent {
  protected bedrockService: BedrockService;
  protected personality: AgentPersonality;
  protected conversationState: Map<string, any> = new Map();

  constructor(personality: AgentPersonality, region?: string) {
    this.personality = personality;
    this.bedrockService = new BedrockService(region);
  }

  /**
   * Generate a supportive response based on user input and context
   */
  async generateSupportiveResponse(context: ConversationContext): Promise<AgentResponse> {
    try {
      // Analyze user's emotional state first
      const emotionalState = await this.analyzeUserEmotionalState(context);
      
      // Adapt personality approach based on emotional state
      this.adaptToUserEmotionalState(emotionalState);
      
      // Generate the core response using Bedrock
      const systemPrompt = this.buildSystemPrompt(context, emotionalState);
      const lastMessage = context.conversationHistory[context.conversationHistory.length - 1];
      const userMessage = lastMessage?.content || '';

      const bedrockResponse = await this.bedrockService.invokeModel(
        systemPrompt,
        userMessage,
        context
      );

      // Process and enhance the response
      const response: AgentResponse = {
        content: bedrockResponse.content,
        audioInstructions: this.generateAudioInstructions(bedrockResponse.content),
        emotionalTone: this.determineEmotionalTone(emotionalState),
        feedback: await this.generateContextualFeedback(context, bedrockResponse.content)
      };

      // Add topic suggestion if appropriate
      if (this.shouldSuggestNewTopic(context, emotionalState)) {
        response.nextTopicSuggestion = await this.suggestNextTopic(context);
      }

      return response;
    } catch (error) {
      console.error('Error generating supportive response:', error);
      return this.getFallbackResponse(context);
    }
  }

  /**
   * Analyze user's emotional state from conversation history
   */
  async analyzeUserEmotionalState(context: ConversationContext): Promise<EmotionalState> {
    const recentMessages = context.conversationHistory.slice(-5);
    
    // Analyze patterns in user messages
    let frustrationIndicators = 0;
    let confidenceIndicators = 0;
    let engagementIndicators = 0;

    for (const message of recentMessages) {
      if (message.sender === 'user') {
        const content = message.content.toLowerCase();
        
        // Frustration indicators
        if (content.includes('difficult') || content.includes('hard') || 
            content.includes('confused') || content.includes('don\'t understand')) {
          frustrationIndicators++;
        }
        
        // Confidence indicators
        if (content.includes('think') || content.includes('maybe') || 
            content.includes('correct') || content.length > 50) {
          confidenceIndicators++;
        }
        
        // Engagement indicators
        if (content.includes('?') || content.includes('how') || 
            content.includes('why') || content.includes('what')) {
          engagementIndicators++;
        }
      }
    }

    const totalMessages = recentMessages.filter(m => m.sender === 'user').length || 1;
    
    return {
      frustrationLevel: Math.min(frustrationIndicators / totalMessages, 1),
      confidenceLevel: Math.min(confidenceIndicators / totalMessages, 1),
      engagementLevel: Math.min(engagementIndicators / totalMessages, 1),
      lastInteractionTime: new Date()
    };
  }

  /**
   * Adapt agent behavior based on user's emotional state
   */
  adaptToUserEmotionalState(userState: EmotionalState): void {
    // Store emotional state for this session
    this.conversationState.set('emotionalState', userState);
    
    // Adjust personality approach based on emotional state
    if (userState.frustrationLevel > 0.6) {
      // High frustration - be more patient and encouraging
      this.conversationState.set('approachMode', 'extra-supportive');
    } else if (userState.confidenceLevel > 0.7) {
      // High confidence - can be more challenging
      this.conversationState.set('approachMode', 'challenging');
    } else if (userState.engagementLevel < 0.3) {
      // Low engagement - try to re-engage with interesting topics
      this.conversationState.set('approachMode', 'engaging');
    } else {
      // Normal state - use default personality approach
      this.conversationState.set('approachMode', 'default');
    }
  }

  /**
   * Provide encouragement based on user progress
   */
  async provideEncouragement(userProgress: ProgressMetrics): Promise<MotivationalMessage> {
    const personalizedElements: string[] = [];
    let messageType: 'encouragement' | 'milestone' | 'progress' | 'reassurance' = 'encouragement';
    let message = '';

    // Check for milestones
    if (userProgress.sessionsCompleted > 0 && userProgress.sessionsCompleted % 5 === 0) {
      messageType = 'milestone';
      message = `Congratulations! You've completed ${userProgress.sessionsCompleted} practice sessions. That's fantastic dedication!`;
      personalizedElements.push(`${userProgress.sessionsCompleted} sessions milestone`);
    }
    // Check for progress improvements
    else if (userProgress.overallImprovement > 0.1) {
      messageType = 'progress';
      const improvementPercent = Math.round(userProgress.overallImprovement * 100);
      message = `Great progress! You've improved by ${improvementPercent}% since you started. Keep up the excellent work!`;
      personalizedElements.push(`${improvementPercent}% improvement`);
    }
    // Check for streak
    else if (userProgress.streakDays > 1) {
      messageType = 'encouragement';
      message = `Amazing! You're on a ${userProgress.streakDays}-day practice streak. Consistency is key to language learning success!`;
      personalizedElements.push(`${userProgress.streakDays}-day streak`);
    }
    // Default encouragement
    else {
      messageType = 'reassurance';
      message = this.getPersonalitySpecificEncouragement();
      personalizedElements.push('personality-based encouragement');
    }

    return {
      message,
      type: messageType,
      personalizedElements
    };
  }

  /**
   * Detect user frustration from conversation patterns
   */
  async detectUserFrustration(conversationHistory: ConversationMessage[]): Promise<FrustrationLevel> {
    const recentUserMessages = conversationHistory
      .filter(msg => msg.sender === 'user')
      .slice(-3);

    const indicators: string[] = [];
    let frustrationScore = 0;

    for (const message of recentUserMessages) {
      const content = message.content.toLowerCase();
      
      // Check for frustration keywords
      if (content.includes('difficult') || content.includes('hard')) {
        indicators.push('Expressing difficulty');
        frustrationScore += 0.3;
      }
      
      if (content.includes('confused') || content.includes('don\'t understand')) {
        indicators.push('Expressing confusion');
        frustrationScore += 0.4;
      }
      
      if (content.includes('give up') || content.includes('too hard')) {
        indicators.push('Expressing desire to quit');
        frustrationScore += 0.5;
      }
      
      // Check for short, repetitive responses (possible disengagement)
      if (content.length < 10 && recentUserMessages.length > 1) {
        indicators.push('Short responses indicating disengagement');
        frustrationScore += 0.2;
      }
      
      // Check transcription confidence (if available)
      if (message.transcriptionConfidence && message.transcriptionConfidence < 0.5) {
        indicators.push('Low transcription confidence (possible speech issues)');
        frustrationScore += 0.2;
      }
    }

    const recommendedActions: string[] = [];
    
    if (frustrationScore > 0.6) {
      recommendedActions.push('Provide extra encouragement and patience');
      recommendedActions.push('Suggest taking a short break');
      recommendedActions.push('Switch to easier topics or exercises');
    } else if (frustrationScore > 0.3) {
      recommendedActions.push('Offer additional explanations');
      recommendedActions.push('Provide more examples');
      recommendedActions.push('Check if user needs clarification');
    }

    return {
      level: Math.min(frustrationScore, 1),
      indicators,
      recommendedActions
    };
  }

  /**
   * Build system prompt based on personality and context
   */
  protected buildSystemPrompt(context: ConversationContext, emotionalState: EmotionalState): string {
    const approachMode = this.conversationState.get('approachMode') || 'default';
    let basePrompt = this.personality.systemPrompt;
    
    // Add emotional state adaptations
    if (approachMode === 'extra-supportive') {
      basePrompt += '\n\nIMPORTANT: The student seems frustrated. Be extra patient, encouraging, and break down concepts into smaller, easier steps. Focus on building confidence.';
    } else if (approachMode === 'challenging') {
      basePrompt += '\n\nIMPORTANT: The student seems confident. You can provide more challenging exercises and advanced concepts while maintaining encouragement.';
    } else if (approachMode === 'engaging') {
      basePrompt += '\n\nIMPORTANT: The student seems disengaged. Try to re-engage them with interesting topics, questions, or interactive exercises.';
    }
    
    // Add personality-specific instructions
    basePrompt += `\n\nPersonality Traits: ${this.personality.traits.join(', ')}`;
    basePrompt += `\nConversation Style: ${this.personality.conversationStyle}`;
    basePrompt += `\nError Handling Approach: ${this.personality.supportiveApproach.errorHandling}`;
    basePrompt += `\nEncouragement Frequency: ${this.personality.supportiveApproach.encouragementFrequency}`;
    
    return basePrompt;
  }

  /**
   * Generate audio instructions for voice synthesis
   */
  protected generateAudioInstructions(content: string): AgentResponse['audioInstructions'] {
    return {
      voiceId: this.personality.voiceCharacteristics.voiceId,
      ssml: this.generateSSML(content),
      emphasis: this.extractEmphasisWords(content)
    };
  }

  /**
   * Generate SSML for enhanced speech synthesis
   */
  protected generateSSML(content: string): string {
    let ssml = `<speak>`;
    
    // Add personality-specific speech characteristics
    const rate = this.personality.voiceCharacteristics.speakingRate || 'medium';
    const pitch = this.personality.voiceCharacteristics.pitch || 'medium';
    
    ssml += `<prosody rate="${rate}" pitch="${pitch}">`;
    
    // Process content for SSML enhancements
    let processedContent = content;
    
    // Add pauses after questions
    processedContent = processedContent.replace(/\?/g, '?<break time="0.5s"/>');
    
    // Emphasize important words (words in quotes or caps)
    processedContent = processedContent.replace(/"([^"]+)"/g, '<emphasis level="strong">$1</emphasis>');
    
    ssml += processedContent;
    ssml += `</prosody></speak>`;
    
    return ssml;
  }

  /**
   * Extract words that should be emphasized in speech
   */
  protected extractEmphasisWords(content: string): string[] {
    const emphasis: string[] = [];
    
    // Words in quotes
    const quotedWords = content.match(/"([^"]+)"/g);
    if (quotedWords) {
      emphasis.push(...quotedWords.map(word => word.replace(/"/g, '')));
    }
    
    // Words in ALL CAPS (but not entire sentences)
    const capsWords = content.match(/\b[A-Z]{2,}\b/g);
    if (capsWords) {
      emphasis.push(...capsWords);
    }
    
    return emphasis;
  }

  /**
   * Determine emotional tone based on user state
   */
  protected determineEmotionalTone(emotionalState: EmotionalState): AgentResponse['emotionalTone'] {
    if (emotionalState.frustrationLevel > 0.6) {
      return 'encouraging';
    } else if (emotionalState.confidenceLevel > 0.7) {
      return 'enthusiastic';
    } else if (emotionalState.engagementLevel < 0.3) {
      return 'encouraging';
    } else {
      return 'neutral';
    }
  }

  /**
   * Generate contextual feedback based on conversation
   */
  protected async generateContextualFeedback(
    context: ConversationContext, 
    response: string
  ): Promise<FeedbackInstance[]> {
    // This will be implemented by specific agent personalities
    // Base implementation returns empty array
    return [];
  }

  /**
   * Check if agent should suggest a new topic
   */
  protected shouldSuggestNewTopic(context: ConversationContext, emotionalState: EmotionalState): boolean {
    const conversationLength = context.conversationHistory.length;
    
    // Suggest new topic if conversation is getting long or user seems disengaged
    return conversationLength > 20 || emotionalState.engagementLevel < 0.3;
  }

  /**
   * Suggest next conversation topic
   */
  protected async suggestNextTopic(context: ConversationContext): Promise<string> {
    // This will be implemented by specific agent personalities
    return 'Would you like to practice a different topic?';
  }

  /**
   * Get personality-specific encouragement message
   */
  protected abstract getPersonalitySpecificEncouragement(): string;

  /**
   * Get fallback response for error cases
   */
  protected getFallbackResponse(context: ConversationContext): AgentResponse {
    return {
      content: "I'm sorry, I'm having trouble right now. Let's try again in a moment.",
      emotionalTone: 'encouraging',
      audioInstructions: {
        voiceId: this.personality.voiceCharacteristics.voiceId
      }
    };
  }

  /**
   * Get agent personality information
   */
  getPersonality(): AgentPersonality {
    return { ...this.personality };
  }

  /**
   * Update conversation state
   */
  updateConversationState(key: string, value: any): void {
    this.conversationState.set(key, value);
  }

  /**
   * Get conversation state
   */
  getConversationState(key: string): any {
    return this.conversationState.get(key);
  }
}