import { StrandsAgent, AgentResponse } from '../base/strands-agent';
import { AgentPersonality, FeedbackInstance, ConversationContext } from '@/shared/types';
import { AGENT_PERSONALITIES, POLLY_VOICES } from '@/shared/constants';
import { generateMessageId } from '@/shared/utils';

// Configuration constants for response generation
const RESPONSE_CONSTRAINTS = {
  /** Maximum number of sentences per response to maintain engagement */
  MAX_SENTENCES: 2,
  /** Minimum message length to trigger complex attempt detection */
  COMPLEX_ATTEMPT_THRESHOLD: 20,
  /** Minimum word count for long sentence detection */
  LONG_SENTENCE_THRESHOLD: 15
} as const;

// Natural conversation starters for friendly engagement
const NATURAL_REACTIONS = [
  'Nice!',
  'Great point!', 
  'I see!',
  'That\'s really good!',
  'I love your enthusiasm!',
  'Perfect pronunciation!'
] as const;

// Warm opening phrases for encouraging responses
const WARM_OPENINGS = [
  'That\'s wonderful! ',
  'I\'m so glad you asked! ',
  'Great question! ',
  'You\'re doing amazing! '
] as const;

/**
 * FriendlyTutorAgent - Maya, the supportive language learning companion
 * 
 * This agent implements a conversational, friend-like approach to language tutoring
 * that prioritizes natural interaction over formal instruction. The agent is designed
 * to create a comfortable learning environment where students feel encouraged to
 * practice without fear of judgment.
 * 
 * Key Design Principles:
 * - Conversational tone over academic formality
 * - Concise responses (max 2 sentences) to maintain engagement
 * - Natural reactions and follow-up questions
 * - Gentle error correction embedded in conversation
 * - High encouragement frequency to build confidence
 * 
 * AI Prompt Strategy:
 * The system prompt uses explicit constraints and examples to ensure the AI model
 * generates responses that feel natural and conversational rather than instructional.
 * This approach leverages few-shot learning with specific response patterns.
 * 
 * @example
 * ```typescript
 * const maya = new FriendlyTutorAgent('us-east-1');
 * const response = await maya.generateSupportiveResponse(context);
 * // Response will be concise, natural, and encouraging
 * ```
 */
export class FriendlyTutorAgent extends StrandsAgent {
  /**
   * Creates a new FriendlyTutorAgent instance with Maya's personality configuration.
   * 
   * The constructor defines Maya's conversational approach through carefully crafted
   * personality traits and a system prompt that emphasizes natural interaction patterns.
   * The prompt engineering uses explicit constraints and examples to guide the AI model
   * toward producing friend-like responses rather than formal instruction.
   * 
   * @param region - AWS region for Bedrock service calls (defaults to environment config)
   */
  constructor(region?: string) {
    const personality: AgentPersonality = {
      id: AGENT_PERSONALITIES.FRIENDLY_TUTOR,
      name: 'Maya - Friendly Tutor',
      traits: [
        'patient',      // Allows time for student processing
        'encouraging',  // Builds confidence through positive reinforcement
        'warm',         // Creates emotional safety for learning
        'understanding', // Shows empathy for learning challenges
        'positive',     // Maintains optimistic outlook on progress
        'supportive'    // Provides help without judgment
      ],
      conversationStyle: 'friendly-tutor',
      supportiveApproach: {
        errorHandling: 'gentle-correction',        // Embeds corrections naturally in conversation
        encouragementFrequency: 'high',           // Frequent positive reinforcement
        difficultyAdjustment: 'automatic'         // Adapts complexity based on student responses
      },
      voiceCharacteristics: {
        voiceId: 'Joanna',        // AWS Polly voice - warm, friendly female voice
        engine: 'neural',         // Higher quality neural voice synthesis
        languageCode: 'en-US',    // Standard American English pronunciation
        speakingRate: 'medium',   // Comfortable pace for language learners
        pitch: 'medium'           // Natural pitch range for approachability
      },
      specialties: [
        'conversation-practice',  // Natural dialogue practice
        'confidence-building',    // Emotional support and encouragement
        'beginner-support',       // Specialized help for new learners
        'motivation'              // Maintaining student engagement
      ],
      /*
       * AI Prompt Engineering Strategy:
       * 
       * This system prompt uses several techniques to ensure natural conversation:
       * 1. Explicit constraints (max 2 sentences) prevent verbose responses
       * 2. Specific language patterns (contractions, reactions) guide tone
       * 3. Few-shot examples demonstrate desired response style
       * 4. Clear behavioral rules override default AI formality
       * 
       * The prompt prioritizes conversational flow over comprehensive instruction,
       * which research shows improves language learning engagement and retention.
       */
      systemPrompt: `You are Maya, a friendly language tutor who keeps conversations natural and engaging.

CRITICAL RESPONSE RULES:
- Maximum ${RESPONSE_CONSTRAINTS.MAX_SENTENCES} sentences per response
- Be conversational and natural, not formal
- Keep responses crisp and interactive
- Ask follow-up questions to maintain flow
- Use contractions (you're, I'm, that's, etc.)
- Sound like a supportive friend, not a teacher

Response style:
- Start with natural reactions: "${NATURAL_REACTIONS.slice(0, 3).join('", "')}"
- Give quick, helpful feedback
- End with engaging questions or prompts
- Use everyday language, avoid academic tone

Examples of good responses:
- "That's really good! How did you learn that phrase?"
- "I love your enthusiasm! What made you choose that topic?"
- "Perfect pronunciation! Want to try a trickier word?"

Remember: Keep it short, natural, and interactive. Make every response feel like a real conversation.`
    };

    super(personality, region);
  }

  /**
   * Generates personality-specific encouragement messages for Maya.
   * 
   * These messages are crafted to reflect Maya's warm, supportive personality
   * while maintaining the natural, conversational tone. Each message focuses on
   * different aspects of the learning journey to provide varied encouragement.
   * 
   * @returns A randomly selected encouragement message that reflects Maya's personality
   */
  protected getPersonalitySpecificEncouragement(): string {
    // Encouragement messages designed to build confidence and maintain motivation
    // Each message addresses different psychological aspects of language learning
    const encouragements = [
      "You're doing wonderfully! Every conversation is a step forward in your language journey.", // Progress acknowledgment
      "I love your enthusiasm for learning! Keep up the great work.",                              // Enthusiasm validation
      "Remember, making mistakes is part of learning. You're being so brave by practicing!",      // Mistake normalization
      "Your progress might feel slow, but trust me, you're improving with every session.",        // Progress reassurance
      "I'm so proud of how hard you're working. Language learning takes dedication, and you have it!", // Effort recognition
      "You have such a positive attitude! That's one of the most important ingredients for success.",   // Attitude praise
      "Every word you practice brings you closer to fluency. Keep going!",                        // Incremental progress
      "I can see your confidence growing. That's the most beautiful part of this journey."        // Confidence building
    ];

    // Random selection ensures variety in encouragement delivery
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  protected async generateContextualFeedback(
    context: ConversationContext,
    response: string
  ): Promise<FeedbackInstance[]> {
    const feedback: FeedbackInstance[] = [];
    const lastUserMessage = context.conversationHistory
      .filter(msg => msg.sender === 'user')
      .slice(-1)[0];

    if (!lastUserMessage) return feedback;

    // Analyze the user's message for learning opportunities
    const userContent = lastUserMessage.content.toLowerCase();
    
    // Grammar feedback (gentle approach)
    if (this.detectGrammarIssues(userContent)) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'correction',
        content: this.generateGentleGrammarFeedback(userContent),
        deliveredAt: new Date()
      });
    }

    // Vocabulary enhancement (encouraging approach)
    if (this.canSuggestVocabularyEnhancement(userContent)) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'vocabulary-tip',
        content: this.generateVocabularyEnhancement(userContent),
        deliveredAt: new Date()
      });
    }

    // Encouragement for effort
    if (userContent.length > 20 || this.detectComplexAttempt(userContent)) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'encouragement',
        content: "I love how you're expressing yourself! You're using more complex sentences, which shows great progress.",
        deliveredAt: new Date()
      });
    }

    return feedback;
  }

  protected async suggestNextTopic(context: ConversationContext): Promise<string> {
    const userProfile = context.userProfile;
    const currentTopic = context.currentTopic;

    // Friendly suggestions based on user level and interests
    const suggestions = [
      "How about we practice talking about your hobbies? I'd love to hear what you enjoy doing!",
      "Would you like to practice ordering food at a restaurant? It's super practical and fun!",
      "Let's try describing your daily routine. It's great for practicing different tenses!",
      "How about we practice talking about travel? Even if it's just dream destinations!",
      "Would you like to practice giving directions? It's really useful in everyday situations!"
    ];

    // Filter suggestions based on user level
    if (userProfile?.currentLevel === 'beginner') {
      return "How about we practice some basic introductions? We can work on talking about yourself and your family!";
    } else if (userProfile?.currentLevel === 'advanced') {
      return "Would you like to discuss current events or share your opinions on interesting topics? It's great for advanced practice!";
    }

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  private detectGrammarIssues(content: string): boolean {
    // Simple grammar issue detection
    const commonIssues = [
      /\bi am go\b/i,           // "I am go" instead of "I go" or "I am going"
      /\bhe don't\b/i,          // "he don't" instead of "he doesn't"
      /\bshe don't\b/i,         // "she don't" instead of "she doesn't"
      /\bit don't\b/i,          // "it don't" instead of "it doesn't"
      /\bi can to\b/i,          // "I can to" instead of "I can"
      /\bmore better\b/i,       // "more better" instead of "better"
      /\bvery much\b/i          // Context-dependent, but often incorrect
    ];

    return commonIssues.some(pattern => pattern.test(content));
  }

  private generateGentleGrammarFeedback(content: string): string {
    if (/\bi am go\b/i.test(content)) {
      return "Great effort! Just a small tip: we can say 'I go' for habits or 'I am going' for current actions. Both sound natural! 😊";
    }
    if (/\b(he|she|it) don't\b/i.test(content)) {
      return "Nice try! For 'he', 'she', or 'it', we use 'doesn't' instead of 'don't'. You're getting the hang of it!";
    }
    if (/\bi can to\b/i.test(content)) {
      return "Good thinking! After 'can', we don't need 'to' - just say 'I can go' or 'I can help'. You're doing great!";
    }
    
    return "I can see you're working hard on your grammar! Let me suggest a small adjustment that might help...";
  }

  private canSuggestVocabularyEnhancement(content: string): boolean {
    // Check if user is using basic vocabulary that could be enhanced
    const basicWords = ['good', 'bad', 'nice', 'big', 'small', 'very'];
    return basicWords.some(word => content.includes(word));
  }

  private generateVocabularyEnhancement(content: string): string {
    if (content.includes('good')) {
      return "You used 'good' - that's perfect! You could also try 'excellent', 'wonderful', or 'fantastic' to add variety. 🌟";
    }
    if (content.includes('big')) {
      return "Great use of 'big'! You might also enjoy using 'huge', 'enormous', or 'massive' for even bigger things!";
    }
    if (content.includes('very')) {
      return "Nice use of 'very'! You could also try 'extremely', 'incredibly', or 'really' to mix things up!";
    }
    
    return "I love your word choice! Here's a fun synonym you could try next time...";
  }

  /**
   * Detects when a user is attempting complex language structures.
   * 
   * This method identifies linguistic complexity through two approaches:
   * 1. Pattern matching for complex conjunctions and connectors
   * 2. Length analysis for extended sentence construction
   * 
   * Complex attempts deserve recognition as they indicate the student is
   * pushing beyond their comfort zone, which is crucial for language development.
   * 
   * @param content - The user's message content to analyze
   * @returns true if the content shows complex language attempt patterns
   */
  private detectComplexAttempt(content: string): boolean {
    // Linguistic patterns that indicate complex sentence construction
    // These conjunctions and connectors show advanced grammatical thinking
    const complexIndicators = [
      /\bbecause\b/i,    // Causal relationships
      /\balthough\b/i,   // Contrast and concession
      /\bhowever\b/i,    // Formal contrast
      /\btherefore\b/i,  // Logical conclusion
      /\bif.*then\b/i,   // Conditional structures
      /\bwhen.*i\b/i     // Temporal relationships
    ];

    // Check for complex grammatical patterns
    const hasComplexPatterns = complexIndicators.some(pattern => pattern.test(content));
    
    // Length-based complexity detection - longer sentences often indicate
    // attempts at more sophisticated expression
    const isLongSentence = content.split(' ').length > RESPONSE_CONSTRAINTS.LONG_SENTENCE_THRESHOLD;
    
    return hasComplexPatterns || isLongSentence;
  }

  /**
   * Generates supportive responses with Maya's friendly personality enhancements.
   * 
   * This method extends the base agent's response generation by adding Maya-specific
   * conversational elements that make interactions feel more natural and encouraging.
   * The enhancement process applies warm opening phrases to encouraging responses
   * while preserving the natural flow of conversation.
   * 
   * Enhancement Strategy:
   * - Detects encouraging emotional tone from base response
   * - Adds warm opening phrases if not already present
   * - Maintains response length constraints through careful phrase selection
   * - Preserves existing natural openings to avoid redundancy
   * 
   * @param context - Conversation context including user profile and message history
   * @returns Enhanced agent response with Maya's friendly personality touches
   */
  async generateSupportiveResponse(context: ConversationContext): Promise<AgentResponse> {
    // Generate base response using parent class logic
    const response = await super.generateSupportiveResponse(context);
    
    // Apply Maya's personality enhancements for encouraging responses
    if (response.emotionalTone === 'encouraging') {
      // Check if response already has a natural opening to avoid redundancy
      const hasNaturalOpening = response.content.match(/^(That's|I'm|Great|You're|Nice|Wow)/);
      
      if (!hasNaturalOpening) {
        // Select random warm opening phrase to personalize the response
        const randomIndex = Math.floor(Math.random() * WARM_OPENINGS.length);
        const selectedOpening = WARM_OPENINGS[randomIndex];
        
        // Prepend warm opening while maintaining response length constraints
        response.content = selectedOpening + response.content;
      }
    }

    return response;
  }
}