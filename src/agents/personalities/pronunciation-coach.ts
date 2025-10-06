import { StrandsAgent, AgentResponse } from '../base/strands-agent';
import { AgentPersonality, FeedbackInstance, ConversationContext } from '@/shared/types';
import { AGENT_PERSONALITIES } from '@/shared/constants';
import { generateMessageId } from '@/shared/utils';

export class PronunciationCoachAgent extends StrandsAgent {
  constructor(region?: string) {
    const personality: AgentPersonality = {
      id: AGENT_PERSONALITIES.PRONUNCIATION_COACH,
      name: 'Dr. Sarah - Pronunciation Coach',
      traits: [
        'precise',
        'patient',
        'analytical',
        'encouraging',
        'methodical',
        'attentive'
      ],
      conversationStyle: 'pronunciation-coach',
      supportiveApproach: {
        errorHandling: 'patient-repetition',
        encouragementFrequency: 'high',
        difficultyAdjustment: 'automatic'
      },
      voiceCharacteristics: {
        voiceId: 'Joanna', // Clear, articulate voice for pronunciation modeling
        engine: 'neural',
        languageCode: 'en-US',
        speakingRate: 'slow',
        pitch: 'medium'
      },
      specialties: [
        'pronunciation-accuracy',
        'phonetic-training',
        'accent-reduction',
        'speech-clarity'
      ],
      systemPrompt: `You are Dr. Sarah, a specialized pronunciation coach who helps students develop clear, confident speech. You focus on the technical aspects of pronunciation while maintaining an encouraging and patient approach.

Key characteristics:
- Break down pronunciation into manageable phonetic components
- Provide specific guidance on mouth position, tongue placement, and breathing
- Use phonetic symbols and detailed explanations when helpful
- Offer repetition exercises and practice techniques
- Focus on the most impactful pronunciation improvements first
- Celebrate small improvements in speech clarity
- Provide alternative pronunciation methods for difficult sounds
- Use visual and tactile descriptions to help with sound production

Your responses should:
- Include specific pronunciation guidance with phonetic details
- Offer practice exercises and repetition techniques
- Use SSML markup to demonstrate correct pronunciation
- Break complex words into syllables and sounds
- Provide mouth position and articulation instructions
- Acknowledge effort and progress in pronunciation attempts

Remember: Clear pronunciation builds confidence. Every sound mastered is a step toward fluent communication.`
    };

    super(personality, region);
  }

  protected getPersonalitySpecificEncouragement(): string {
    const encouragements = [
      "Your pronunciation is improving with each practice session. I can hear the difference!",
      "Excellent effort on that sound! Your mouth positioning is getting much better.",
      "I love how you're focusing on the details. That attention to pronunciation will pay off.",
      "Your speech clarity has noticeably improved. Keep practicing those techniques!",
      "Great job working on that challenging sound. Persistence is key in pronunciation training.",
      "I can hear more confidence in your voice. That's just as important as accuracy!",
      "Your articulation is becoming clearer. Native speakers will understand you much better now.",
      "Wonderful progress! You're developing the muscle memory for these sounds."
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

    // Analyze transcription confidence for pronunciation issues
    if (lastUserMessage.transcriptionConfidence && lastUserMessage.transcriptionConfidence < 0.7) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'pronunciation-guide',
        content: this.generatePronunciationGuidance(lastUserMessage.content, lastUserMessage.transcriptionConfidence),
        deliveredAt: new Date()
      });
    }

    // Identify specific pronunciation challenges
    const pronunciationChallenges = this.identifyPronunciationChallenges(lastUserMessage.content);
    if (pronunciationChallenges.length > 0) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'pronunciation-guide',
        content: this.generateSpecificPronunciationFeedback(pronunciationChallenges),
        deliveredAt: new Date()
      });
    }

    // Provide practice exercises for difficult sounds
    const practiceExercises = this.generatePracticeExercises(lastUserMessage.content);
    if (practiceExercises) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'suggestion',
        content: practiceExercises,
        deliveredAt: new Date()
      });
    }

    // Acknowledge good pronunciation
    if (this.detectGoodPronunciation(lastUserMessage)) {
      feedback.push({
        feedbackId: generateMessageId(),
        sessionId: context.sessionId,
        messageId: lastUserMessage.messageId || '',
        type: 'encouragement',
        content: this.generatePronunciationEncouragement(lastUserMessage.content),
        deliveredAt: new Date()
      });
    }

    return feedback;
  }

  protected async suggestNextTopic(context: ConversationContext): Promise<string> {
    const userProfile = context.userProfile;
    
    // Suggest pronunciation-focused topics
    const pronunciationTopics = [
      "Let's practice words with the 'th' sound - they're tricky but very common in English.",
      "How about we work on vowel sounds? I'll help you distinguish between similar sounds like 'ship' and 'sheep'.",
      "Let's practice consonant clusters - words like 'strength' and 'months' that have multiple consonants together.",
      "Would you like to work on word stress patterns? It's crucial for natural-sounding English.",
      "Let's focus on linking sounds between words - it'll make your speech flow more naturally.",
      "How about practicing minimal pairs? We'll work on sounds that are often confused.",
      "Let's work on intonation patterns - the melody of English that conveys meaning and emotion."
    ];

    // Tailor suggestions based on user level
    if (userProfile?.currentLevel === 'beginner') {
      return "Let's start with basic vowel sounds. We'll practice the difference between 'bit' and 'beat' - these are fundamental for clear English.";
    } else if (userProfile?.currentLevel === 'advanced') {
      return "Let's work on advanced pronunciation features like connected speech and reduction patterns that native speakers use.";
    }

    return pronunciationTopics[Math.floor(Math.random() * pronunciationTopics.length)];
  }

  private generatePronunciationGuidance(content: string, confidence: number): string {
    let guidance = "I noticed some pronunciation challenges. Let me help you with that:\n\n";
    
    if (confidence < 0.5) {
      guidance += "The transcription confidence was quite low, which suggests pronunciation needs attention. ";
      guidance += "Let's slow down and focus on clear articulation. ";
    } else if (confidence < 0.7) {
      guidance += "There were some unclear sounds. Let's work on making them more distinct. ";
    }

    guidance += "Try speaking more slowly and exaggerating the mouth movements for each sound. ";
    guidance += "Remember: clarity is more important than speed!";

    return guidance;
  }

  private identifyPronunciationChallenges(content: string): Array<{word: string, sound: string, guidance: string}> {
    const challenges: Array<{word: string, sound: string, guidance: string}> = [];

    // Common pronunciation challenges for language learners
    const challengePatterns = [
      {
        pattern: /\b\w*th\w*\b/gi,
        sound: 'th',
        guidance: 'Place your tongue between your teeth and blow air gently'
      },
      {
        pattern: /\b\w*[rl]\w*\b/gi,
        sound: 'r/l',
        guidance: 'For R: curl tongue back without touching roof. For L: touch tongue tip to roof behind teeth'
      },
      {
        pattern: /\b\w*v\w*\b/gi,
        sound: 'v',
        guidance: 'Touch bottom lip to top teeth and vibrate vocal cords'
      },
      {
        pattern: /\b\w*w\w*\b/gi,
        sound: 'w',
        guidance: 'Round your lips like saying "oo" then quickly move to the next sound'
      }
    ];

    challengePatterns.forEach(challenge => {
      const matches = content.match(challenge.pattern);
      if (matches) {
        matches.forEach(word => {
          challenges.push({
            word: word.toLowerCase(),
            sound: challenge.sound,
            guidance: challenge.guidance
          });
        });
      }
    });

    return challenges.slice(0, 3); // Limit to 3 challenges to avoid overwhelming
  }

  private generateSpecificPronunciationFeedback(challenges: Array<{word: string, sound: string, guidance: string}>): string {
    let feedback = "Let's work on these specific sounds:\n\n";
    
    challenges.forEach((challenge, index) => {
      feedback += `${index + 1}. "${challenge.word}" - ${challenge.sound} sound:\n`;
      feedback += `   ${challenge.guidance}\n`;
      feedback += `   Practice: Repeat "${challenge.word}" slowly 5 times\n\n`;
    });

    feedback += "Focus on one sound at a time. Muscle memory takes practice!";
    return feedback;
  }

  private generatePracticeExercises(content: string): string | null {
    // Generate targeted practice exercises based on content
    const words = content.toLowerCase().split(/\s+/);
    
    // Find words with common pronunciation challenges
    const challengingWords = words.filter(word => 
      /th|[rl]|v|w|sh|ch|ng/.test(word) && word.length > 2
    );

    if (challengingWords.length === 0) return null;

    const targetWord = challengingWords[0];
    
    return `Practice Exercise:\n` +
           `1. Say "${targetWord}" very slowly, focusing on each sound\n` +
           `2. Break it into syllables: ${this.syllabify(targetWord)}\n` +
           `3. Repeat 10 times, gradually increasing speed\n` +
           `4. Use it in a sentence: "I can say ${targetWord} clearly"\n\n` +
           `Remember: Slow and clear beats fast and unclear!`;
  }

  private detectGoodPronunciation(message: any): boolean {
    // Detect indicators of good pronunciation
    return (message.transcriptionConfidence && message.transcriptionConfidence > 0.8) ||
           (message.content && message.content.length > 20 && !this.hasCommonErrors(message.content));
  }

  private generatePronunciationEncouragement(content: string): string {
    const encouragements = [
      "Excellent clarity! Your pronunciation is really coming along nicely.",
      "I can hear the improvement in your articulation. Great work!",
      "Your speech sounds much more confident and clear. Keep it up!",
      "Beautiful pronunciation on those sounds! You're developing great habits.",
      "I love how clearly you're speaking. That's exactly what we're aiming for!"
    ];

    return encouragements[Math.floor(Math.random() * encouragements.length)];
  }

  private syllabify(word: string): string {
    // Simple syllabification for practice
    // This is a basic implementation - real syllabification is more complex
    const vowels = 'aeiouAEIOU';
    let syllables = [];
    let currentSyllable = '';
    
    for (let i = 0; i < word.length; i++) {
      currentSyllable += word[i];
      
      if (vowels.includes(word[i]) && i < word.length - 1 && !vowels.includes(word[i + 1])) {
        syllables.push(currentSyllable);
        currentSyllable = '';
      }
    }
    
    if (currentSyllable) {
      syllables.push(currentSyllable);
    }
    
    return syllables.join('-') || word;
  }

  private hasCommonErrors(content: string): boolean {
    // Check for common pronunciation-related transcription errors
    const errorPatterns = [
      /\bz\b/g,        // Single 'z' often indicates unclear speech
      /\b[bcdfg]\b/g,  // Single consonants often indicate unclear endings
      /\d+/g           // Numbers in transcription often indicate unclear speech
    ];

    return errorPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Override SSML generation for pronunciation coaching
   */
  protected generateSSML(content: string): string {
    let ssml = `<speak>`;
    
    // Slower rate for pronunciation modeling
    ssml += `<prosody rate="slow" pitch="medium">`;
    
    // Process content for pronunciation-specific SSML
    let processedContent = content;
    
    // Add longer pauses for pronunciation practice
    processedContent = processedContent.replace(/\./g, '.<break time="1s"/>');
    processedContent = processedContent.replace(/,/g, ',<break time="0.5s"/>');
    
    // Emphasize pronunciation guidance words
    processedContent = processedContent.replace(
      /(tongue|lips|teeth|breath|sound)/gi, 
      '<emphasis level="strong">$1</emphasis>'
    );
    
    // Add phoneme pronunciation for specific sounds
    processedContent = processedContent.replace(
      /\b(th|sh|ch|ng)\b/gi,
      '<phoneme alphabet="ipa" ph="$1">$1</phoneme>'
    );
    
    ssml += processedContent;
    ssml += `</prosody></speak>`;
    
    return ssml;
  }

  /**
   * Override response generation to include pronunciation-specific elements
   */
  async generateSupportiveResponse(context: ConversationContext): Promise<AgentResponse> {
    const response = await super.generateSupportiveResponse(context);
    
    // Add pronunciation-specific audio instructions
    if (response.audioInstructions) {
      response.audioInstructions.ssml = this.generateSSML(response.content);
      
      // Add emphasis on pronunciation-related words
      const pronunciationWords = this.extractPronunciationWords(response.content);
      response.audioInstructions.emphasis = [
        ...(response.audioInstructions.emphasis || []),
        ...pronunciationWords
      ];
    }

    return response;
  }

  private extractPronunciationWords(content: string): string[] {
    const pronunciationKeywords = [
      'tongue', 'lips', 'teeth', 'breath', 'sound', 'voice',
      'articulation', 'pronunciation', 'clarity', 'practice'
    ];

    return pronunciationKeywords.filter(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(content)
    );
  }
}