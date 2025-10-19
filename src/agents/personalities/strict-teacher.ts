import { StrandsAgent, AgentResponse } from '../base/strands-agent';
import { AgentPersonality, FeedbackInstance, ConversationContext } from '@/shared/types';
import { AGENT_PERSONALITIES } from '@/shared/constants';
import { generateMessageId } from '@/shared/utils';

export class StrictTeacherAgent extends StrandsAgent {
  constructor(region?: string) {
    const personality: AgentPersonality = {
      id: AGENT_PERSONALITIES.STRICT_TEACHER,
      name: 'Professor Chen - Strict Teacher',
      traits: [
        'precise',
        'structured',
        'demanding',
        'thorough',
        'focused',
        'disciplined'
      ],
      conversationStyle: 'strict-teacher',
      supportiveApproach: {
        errorHandling: 'positive-reinforcement',
        encouragementFrequency: 'medium',
        difficultyAdjustment: 'user-guided'
      },
      voiceCharacteristics: {
        voiceId: 'Matthew', // Clear, authoritative male voice
        engine: 'neural',
        languageCode: 'en-US',
        speakingRate: 'medium',
        pitch: 'medium'
      },
      specialties: [
        'grammar-accuracy',
        'pronunciation-precision',
        'formal-language',
        'structured-learning'
      ],
      systemPrompt: `You are Professor Chen, a precise but efficient language teacher who values accuracy and clarity.

CRITICAL RESPONSE RULES:
- Maximum 2 sentences per response
- Be direct and clear, but not harsh
- Focus on one key point per response
- Give specific, actionable feedback
- Keep corrections brief and constructive
- Ask focused questions to check understanding

Response style:
- Start with acknowledgment: "Good effort", "I see the issue"
- Give one clear correction or tip
- End with a specific question or next step
- Use professional but warm tone

Examples of good responses:
- "Good try! Use 'doesn't' with 'he'. Can you fix that sentence?"
- "Excellent grammar! Now try using a more formal word for 'good'."
- "I see the pattern. Remember: past tense needs '-ed'. Try again?"

Remember: Be precise, helpful, and concise. One clear point per response.`
    };

    super(personality, region);
  }

  protected getPersonalitySpecificEncouragement(): string {
    const encouragements = [
      "Your dedication to accuracy is commendable. Precision in language comes from consistent practice.",
      "I can see improvement in your grammar structure. Continue applying the rules we've discussed.",
      "Excellent effort. Remember, mastery comes from understanding the underlying principles.",
      "Your attention to detail is developing well. This foundation will serve you throughout your language journey.",
      "Good progress. Now let's focus on refining your accuracy to the next level.",
      "I appreciate your commitment to learning properly. Quality practice leads to quality results.",
      "Your systematic approach to learning is paying off. Keep following the structured path.",
      "Well done. Remember, every correction is a step toward fluency and confidence."
    ];

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

    const userContent = lastUserMessage.content;
    
    // Detailed grammar analysis
    const grammarIssues = this.analyzeGrammarThoroughly(userContent);
    if (grammarIssues.length > 0) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'correction',
        content: this.generateDetailedGrammarFeedback(grammarIssues),
        deliveredAt: new Date()
      });
    }

    // Vocabulary precision feedback
    const vocabularyIssues = this.analyzeVocabularyPrecision(userContent);
    if (vocabularyIssues.length > 0) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'vocabulary-tip',
        content: this.generateVocabularyPrecisionFeedback(vocabularyIssues),
        deliveredAt: new Date()
      });
    }

    // Structure and organization feedback
    if (this.needsStructureImprovement(userContent)) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'suggestion',
        content: this.generateStructureFeedback(userContent),
        deliveredAt: new Date()
      });
    }

    // Acknowledge good practices
    if (this.detectGoodPractices(userContent)) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'encouragement',
        content: this.generatePrecisionEncouragement(userContent),
        deliveredAt: new Date()
      });
    }

    return feedback;
  }

  protected async suggestNextTopic(context: ConversationContext): Promise<string> {
    const userProfile = context.userProfile;
    
    // Structured topic progression based on learning objectives
    if (userProfile?.currentLevel === 'beginner') {
      return "Let's focus on mastering basic sentence structures. We'll practice subject-verb-object patterns with present tense verbs.";
    } else if (userProfile?.currentLevel === 'intermediate') {
      return "I suggest we work on complex sentence construction using subordinate clauses. This will strengthen your grammatical foundation.";
    } else if (userProfile?.currentLevel === 'advanced') {
      return "Let's practice formal register and academic language. We'll focus on precise vocabulary and sophisticated grammatical structures.";
    }

    return "Based on your current performance, I recommend we focus on areas that need systematic improvement. Shall we review your recent errors and create a targeted practice plan?";
  }

  private analyzeGrammarThoroughly(content: string): Array<{type: string, issue: string, rule: string}> {
    const issues: Array<{type: string, issue: string, rule: string}> = [];

    // Subject-verb agreement
    if (/\b(he|she|it)\s+(don't|have|are)\b/i.test(content)) {
      issues.push({
        type: 'subject-verb-agreement',
        issue: 'Third person singular verb form',
        rule: 'Use "doesn\'t", "has", "is" with he/she/it'
      });
    }

    // Verb tense consistency
    if (this.detectTenseInconsistency(content)) {
      issues.push({
        type: 'tense-consistency',
        issue: 'Mixed tenses in sentence',
        rule: 'Maintain consistent tense throughout related clauses'
      });
    }

    // Article usage
    if (this.detectArticleErrors(content)) {
      issues.push({
        type: 'article-usage',
        issue: 'Incorrect or missing articles',
        rule: 'Use "a/an" for singular countable nouns, "the" for specific references'
      });
    }

    // Preposition usage
    if (this.detectPrepositionErrors(content)) {
      issues.push({
        type: 'preposition-usage',
        issue: 'Incorrect preposition choice',
        rule: 'Prepositions must match their specific contexts and meanings'
      });
    }

    return issues;
  }

  private generateDetailedGrammarFeedback(issues: Array<{type: string, issue: string, rule: string}>): string {
    let feedback = "I need to address several grammatical points:\n\n";
    
    issues.forEach((issue, index) => {
      feedback += `${index + 1}. ${issue.issue}: ${issue.rule}\n`;
    });

    feedback += "\nPlease review these rules and apply them in your next response. Accuracy is essential for clear communication.";
    return feedback;
  }

  private analyzeVocabularyPrecision(content: string): Array<{word: string, suggestion: string, reason: string}> {
    const issues: Array<{word: string, suggestion: string, reason: string}> = [];

    // Check for imprecise word choices
    const impreciseWords = [
      { word: 'thing', suggestion: 'object, item, matter, issue', reason: 'Too vague for precise communication' },
      { word: 'stuff', suggestion: 'materials, items, belongings', reason: 'Informal and imprecise' },
      { word: 'a lot', suggestion: 'many, numerous, frequently', reason: 'Informal; use specific quantifiers' },
      { word: 'really', suggestion: 'extremely, significantly, considerably', reason: 'Overused intensifier' }
    ];

    impreciseWords.forEach(item => {
      if (new RegExp(`\\b${item.word}\\b`, 'i').test(content)) {
        issues.push(item);
      }
    });

    return issues;
  }

  private generateVocabularyPrecisionFeedback(issues: Array<{word: string, suggestion: string, reason: string}>): string {
    let feedback = "Vocabulary precision points:\n\n";
    
    issues.forEach((issue, index) => {
      feedback += `${index + 1}. "${issue.word}" - ${issue.reason}. Consider: ${issue.suggestion}\n`;
    });

    feedback += "\nPrecise vocabulary demonstrates advanced language competency.";
    return feedback;
  }

  private needsStructureImprovement(content: string): boolean {
    // Check for run-on sentences or lack of structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Very long sentences without proper punctuation
    if (sentences.some(sentence => sentence.split(' ').length > 25)) {
      return true;
    }

    // Lack of connecting words in complex ideas
    if (content.length > 100 && !/(however|therefore|furthermore|moreover|consequently)/i.test(content)) {
      return true;
    }

    return false;
  }

  private generateStructureFeedback(content: string): string {
    return "Your ideas are good, but the structure needs improvement. Consider:\n" +
           "1. Break long sentences into shorter, clearer ones\n" +
           "2. Use transitional phrases to connect ideas\n" +
           "3. Organize thoughts in logical sequence\n" +
           "Clear structure enhances communication effectiveness.";
  }

  private detectGoodPractices(content: string): boolean {
    // Recognize proper grammar usage, good structure, etc.
    const goodPractices = [
      /\b(although|however|therefore|furthermore)\b/i, // Good connectors
      /\b(specifically|particularly|especially)\b/i,    // Precise language
      /[.!?]\s+[A-Z]/g,                                // Proper sentence structure
    ];

    return goodPractices.some(pattern => pattern.test(content));
  }

  private generatePrecisionEncouragement(content: string): string {
    if (/\b(although|however|therefore)\b/i.test(content)) {
      return "Excellent use of transitional phrases. This demonstrates sophisticated language control.";
    }
    if (/\b(specifically|particularly)\b/i.test(content)) {
      return "Good precision in your language choice. This level of specificity is commendable.";
    }
    return "I notice improved attention to grammatical accuracy. Continue this systematic approach.";
  }

  private detectTenseInconsistency(content: string): boolean {
    // Simple detection of mixed tenses
    const pastTense = /\b(was|were|had|did|went|came|saw)\b/i.test(content);
    const presentTense = /\b(is|are|have|do|go|come|see)\b/i.test(content);
    const futureTense = /\b(will|going to)\b/i.test(content);
    
    // Count how many different tenses are used
    const tenseCount = [pastTense, presentTense, futureTense].filter(Boolean).length;
    return tenseCount > 1 && content.length < 100; // Mixed tenses in short text
  }

  private detectArticleErrors(content: string): boolean {
    // Basic article error detection
    return /\b(go to school|go to work|play piano|speak english)\b/i.test(content) ||
           /\ba university\b/i.test(content) || // Should be "a university" (correct) vs "an university" (incorrect)
           /\ban hour\b/i.test(content); // Should be "an hour" (correct)
  }

  private detectPrepositionErrors(content: string): boolean {
    // Common preposition errors
    const errors = [
      /\bdepends of\b/i,      // Should be "depends on"
      /\blistening music\b/i, // Should be "listening to music"
      /\bmarried with\b/i,    // Should be "married to"
      /\bdifferent than\b/i   // Should be "different from"
    ];

    return errors.some(pattern => pattern.test(content));
  }

  /**
   * Override response generation to add structured approach
   */
  async generateSupportiveResponse(context: ConversationContext): Promise<AgentResponse> {
    const response = await super.generateSupportiveResponse(context);
    
    // Add structured elements to responses
    if (response.feedback && response.feedback.length > 0) {
      // Organize feedback in a structured manner
      const structuredContent = this.structureResponse(response.content, response.feedback);
      response.content = structuredContent;
    }

    return response;
  }

  private structureResponse(content: string, feedback: FeedbackInstance[]): string {
    let structured = content;

    // Add clear sections if there's feedback
    if (feedback.length > 0) {
      structured += "\n\n--- Learning Points ---\n";
      feedback.forEach((fb, index) => {
        structured += `${index + 1}. ${fb.content}\n`;
      });
      structured += "\nApply these points in your next response.";
    }

    return structured;
  }
}