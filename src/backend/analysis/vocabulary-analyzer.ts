import { ComprehendClient, DetectEntitiesCommand, DetectKeyPhrasesCommand } from '@aws-sdk/client-comprehend';
import { BedrockClient } from '../services/bedrock-client';
import { 
  ConversationContext, 
  LanguageLevel,
  ImprovementSuggestion 
} from '@/shared/types';

export interface VocabularyAnalysisConfig {
  languageCode: string;
  targetLevel: LanguageLevel;
  includeEntityAnalysis: boolean;
  includeSynonymSuggestions: boolean;
  includeComplexityAnalysis: boolean;
  focusAreas: VocabularyFocusArea[];
}

export type VocabularyFocusArea = 'academic' | 'business' | 'casual' | 'technical' | 'creative';

export interface VocabularyAnalysisResult {
  vocabularyScore: number;
  complexityLevel: LanguageLevel;
  diversityScore: number;
  appropriatenessScore: number;
  entities: DetectedEntity[];
  keyPhrases: DetectedKeyPhrase[];
  suggestions: VocabularySuggestion[];
  alternatives: VocabularyAlternative[];
  confidence: number;
  analysisTimestamp: Date;
}

export interface DetectedEntity {
  text: string;
  type: string;
  confidence: number;
  beginOffset: number;
  endOffset: number;
  complexity: 'basic' | 'intermediate' | 'advanced';
}

export interface DetectedKeyPhrase {
  text: string;
  confidence: number;
  beginOffset: number;
  endOffset: number;
  relevance: number;
}

export interface VocabularySuggestion {
  type: 'synonym' | 'simpler' | 'more-advanced' | 'context-appropriate';
  original: string;
  suggested: string[];
  explanation: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface VocabularyAlternative {
  original: string;
  alternatives: string[];
  context: string;
  difficulty: LanguageLevel;
  appropriateness: number;
}

export class VocabularyAnalyzer {
  private comprehendClient: ComprehendClient;
  private bedrockClient: BedrockClient;
  private vocabularyDatabase: Map<string, VocabularyEntry>;

  constructor(region?: string) {
    this.comprehendClient = new ComprehendClient({
      region: region || process.env.AWS_REGION || 'us-east-1'
    });
    this.bedrockClient = new BedrockClient(region);
    this.vocabularyDatabase = this.initializeVocabularyDatabase();
  }

  /**
   * Analyze vocabulary usage and provide suggestions
   */
  async analyzeVocabulary(
    text: string,
    context: ConversationContext,
    config: VocabularyAnalysisConfig
  ): Promise<VocabularyAnalysisResult> {
    try {
      // Step 1: Basic text analysis
      const words = this.extractWords(text);
      const sentences = this.extractSentences(text);

      // Step 2: Entity and key phrase detection with Comprehend
      const comprehendAnalysis = await this.analyzeWithComprehend(text, config.languageCode);

      // Step 3: Vocabulary complexity analysis
      const complexityAnalysis = this.analyzeComplexity(words, config.targetLevel);

      // Step 4: Diversity and appropriateness analysis
      const diversityScore = this.calculateDiversityScore(words);
      const appropriatenessScore = this.calculateAppropriatenessScore(
        words, 
        context.currentTopic, 
        config.focusAreas
      );

      // Step 5: Enhanced analysis with Bedrock
      const bedrockAnalysis = await this.analyzeWithBedrock(
        text, 
        context, 
        comprehendAnalysis,
        config
      );

      // Step 6: Generate suggestions and alternatives
      const suggestions = await this.generateVocabularySuggestions(
        text,
        words,
        comprehendAnalysis,
        bedrockAnalysis,
        config
      );

      const alternatives = this.generateVocabularyAlternatives(
        words,
        context,
        config.targetLevel
      );

      // Step 7: Calculate overall vocabulary score
      const vocabularyScore = this.calculateVocabularyScore(
        complexityAnalysis,
        diversityScore,
        appropriatenessScore,
        config.targetLevel
      );

      return {
        vocabularyScore,
        complexityLevel: complexityAnalysis.overallLevel,
        diversityScore,
        appropriatenessScore,
        entities: comprehendAnalysis.entities,
        keyPhrases: comprehendAnalysis.keyPhrases,
        suggestions,
        alternatives,
        confidence: this.calculateConfidence(comprehendAnalysis, bedrockAnalysis),
        analysisTimestamp: new Date()
      };

    } catch (error) {
      console.error('Error analyzing vocabulary:', error);
      throw new Error(`Vocabulary analysis failed: ${error}`);
    }
  }

  /**
   * Analyze with Amazon Comprehend
   */
  private async analyzeWithComprehend(
    text: string,
    languageCode: string
  ): Promise<{
    entities: DetectedEntity[];
    keyPhrases: DetectedKeyPhrase[];
    confidence: number;
  }> {
    try {
      // Detect entities
      const entitiesCommand = new DetectEntitiesCommand({
        Text: text,
        LanguageCode: languageCode
      });

      const entitiesResponse = await this.comprehendClient.send(entitiesCommand);

      // Detect key phrases
      const keyPhrasesCommand = new DetectKeyPhrasesCommand({
        Text: text,
        LanguageCode: languageCode
      });

      const keyPhrasesResponse = await this.comprehendClient.send(keyPhrasesCommand);

      // Convert to our format
      const entities: DetectedEntity[] = (entitiesResponse.Entities || []).map(entity => ({
        text: entity.Text || '',
        type: entity.Type || 'OTHER',
        confidence: entity.Score || 0,
        beginOffset: entity.BeginOffset || 0,
        endOffset: entity.EndOffset || 0,
        complexity: this.determineEntityComplexity(entity.Text || '', entity.Type || '')
      }));

      const keyPhrases: DetectedKeyPhrase[] = (keyPhrasesResponse.KeyPhrases || []).map(phrase => ({
        text: phrase.Text || '',
        confidence: phrase.Score || 0,
        beginOffset: phrase.BeginOffset || 0,
        endOffset: phrase.EndOffset || 0,
        relevance: this.calculatePhraseRelevance(phrase.Text || '')
      }));

      const avgConfidence = [...entities, ...keyPhrases].length > 0 ?
        [...entities, ...keyPhrases].reduce((sum, item) => sum + item.confidence, 0) / 
        [...entities, ...keyPhrases].length : 0.7;

      return {
        entities,
        keyPhrases,
        confidence: avgConfidence
      };

    } catch (error) {
      console.error('Error with Comprehend analysis:', error);
      return {
        entities: [],
        keyPhrases: [],
        confidence: 0.5
      };
    }
  }

  /**
   * Enhanced analysis with Bedrock
   */
  private async analyzeWithBedrock(
    text: string,
    context: ConversationContext,
    comprehendAnalysis: any,
    config: VocabularyAnalysisConfig
  ): Promise<{
    vocabularyScore: number;
    suggestions: any[];
    alternatives: any[];
    contextualFeedback: string[];
  }> {
    try {
      const prompt = this.buildBedrockVocabularyPrompt(text, context, comprehendAnalysis, config);

      const response = await this.bedrockClient.invokeModel({
        modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        body: {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1200,
          messages: [{
            role: 'user',
            content: prompt
          }]
        }
      });

      return this.parseBedrockVocabularyResponse(response.content);

    } catch (error) {
      console.error('Error with Bedrock vocabulary analysis:', error);
      return {
        vocabularyScore: 0.7,
        suggestions: [],
        alternatives: [],
        contextualFeedback: []
      };
    }
  }

  /**
   * Extract words from text
   */
  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Extract sentences from text
   */
  private extractSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }

  /**
   * Analyze vocabulary complexity
   */
  private analyzeComplexity(
    words: string[],
    targetLevel: LanguageLevel
  ): {
    overallLevel: LanguageLevel;
    wordLevels: Map<string, LanguageLevel>;
    complexityDistribution: Record<LanguageLevel, number>;
  } {
    const wordLevels = new Map<string, LanguageLevel>();
    const complexityDistribution: Record<LanguageLevel, number> = {
      'beginner': 0,
      'elementary': 0,
      'intermediate': 0,
      'upper-intermediate': 0,
      'advanced': 0,
      'proficient': 0
    };

    // Analyze each word
    for (const word of words) {
      const level = this.determineWordComplexity(word);
      wordLevels.set(word, level);
      complexityDistribution[level]++;
    }

    // Determine overall level
    const totalWords = words.length;
    let weightedScore = 0;
    const levelWeights = {
      'beginner': 1,
      'elementary': 2,
      'intermediate': 3,
      'upper-intermediate': 4,
      'advanced': 5,
      'proficient': 6
    };

    for (const [level, count] of Object.entries(complexityDistribution)) {
      weightedScore += levelWeights[level as LanguageLevel] * count;
    }

    const averageLevel = weightedScore / totalWords;
    const overallLevel = this.scoreToLevel(averageLevel);

    return {
      overallLevel,
      wordLevels,
      complexityDistribution
    };
  }

  /**
   * Calculate vocabulary diversity score
   */
  private calculateDiversityScore(words: string[]): number {
    if (words.length === 0) return 0;

    const uniqueWords = new Set(words);
    const typeTokenRatio = uniqueWords.size / words.length;

    // Adjust for text length (longer texts naturally have lower TTR)
    const lengthAdjustment = Math.min(1, Math.log(words.length) / Math.log(100));
    
    return Math.min(1, typeTokenRatio / lengthAdjustment);
  }

  /**
   * Calculate appropriateness score for context
   */
  private calculateAppropriatenessScore(
    words: string[],
    topic: string,
    focusAreas: VocabularyFocusArea[]
  ): number {
    let appropriateWords = 0;
    let totalRelevantWords = 0;

    for (const word of words) {
      if (this.isContentWord(word)) {
        totalRelevantWords++;
        
        if (this.isAppropriateForContext(word, topic, focusAreas)) {
          appropriateWords++;
        }
      }
    }

    return totalRelevantWords > 0 ? appropriateWords / totalRelevantWords : 0.7;
  }

  /**
   * Generate vocabulary suggestions
   */
  private async generateVocabularySuggestions(
    text: string,
    words: string[],
    comprehendAnalysis: any,
    bedrockAnalysis: any,
    config: VocabularyAnalysisConfig
  ): Promise<VocabularySuggestion[]> {
    const suggestions: VocabularySuggestion[] = [];

    // Add suggestions from Bedrock analysis
    if (bedrockAnalysis.suggestions) {
      suggestions.push(...bedrockAnalysis.suggestions);
    }

    // Generate rule-based suggestions
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLevel = this.determineWordComplexity(word);
      
      // Suggest simpler alternatives for advanced learners using complex words
      if (config.targetLevel !== 'advanced' && config.targetLevel !== 'proficient') {
        if (this.isWordTooComplex(word, config.targetLevel)) {
          const simpler = this.getSimplerAlternatives(word);
          if (simpler.length > 0) {
            suggestions.push({
              type: 'simpler',
              original: word,
              suggested: simpler,
              explanation: `Consider using simpler alternatives for "${word}"`,
              confidence: 0.8,
              position: this.findWordPosition(text, word, i)
            });
          }
        }
      }

      // Suggest more advanced alternatives for advanced learners
      if (config.targetLevel === 'advanced' || config.targetLevel === 'proficient') {
        if (wordLevel === 'beginner' || wordLevel === 'elementary') {
          const advanced = this.getAdvancedAlternatives(word);
          if (advanced.length > 0) {
            suggestions.push({
              type: 'more-advanced',
              original: word,
              suggested: advanced,
              explanation: `Try using more sophisticated vocabulary instead of "${word}"`,
              confidence: 0.7,
              position: this.findWordPosition(text, word, i)
            });
          }
        }
      }

      // Suggest synonyms for variety
      if (config.includeSynonymSuggestions) {
        const synonyms = this.getSynonyms(word);
        if (synonyms.length > 0) {
          suggestions.push({
            type: 'synonym',
            original: word,
            suggested: synonyms,
            explanation: `Add variety by using synonyms for "${word}"`,
            confidence: 0.6,
            position: this.findWordPosition(text, word, i)
          });
        }
      }
    }

    // Limit and prioritize suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  /**
   * Generate vocabulary alternatives
   */
  private generateVocabularyAlternatives(
    words: string[],
    context: ConversationContext,
    targetLevel: LanguageLevel
  ): VocabularyAlternative[] {
    const alternatives: VocabularyAlternative[] = [];
    const uniqueWords = [...new Set(words)];

    for (const word of uniqueWords.slice(0, 10)) { // Limit to 10 words
      if (this.isContentWord(word)) {
        const wordAlternatives = this.getAllAlternatives(word, targetLevel);
        
        if (wordAlternatives.length > 0) {
          alternatives.push({
            original: word,
            alternatives: wordAlternatives,
            context: context.currentTopic,
            difficulty: this.determineWordComplexity(word),
            appropriateness: this.calculateWordAppropriatenessScore(word, context.currentTopic)
          });
        }
      }
    }

    return alternatives;
  }

  /**
   * Calculate overall vocabulary score
   */
  private calculateVocabularyScore(
    complexityAnalysis: any,
    diversityScore: number,
    appropriatenessScore: number,
    targetLevel: LanguageLevel
  ): number {
    const levelWeights = {
      'beginner': 1,
      'elementary': 2,
      'intermediate': 3,
      'upper-intermediate': 4,
      'advanced': 5,
      'proficient': 6
    };

    const targetWeight = levelWeights[targetLevel];
    const actualWeight = levelWeights[complexityAnalysis.overallLevel];

    // Score based on how well complexity matches target level
    const complexityScore = 1 - Math.abs(targetWeight - actualWeight) / 6;

    // Combine scores with weights
    const score = (
      complexityScore * 0.4 +
      diversityScore * 0.3 +
      appropriatenessScore * 0.3
    );

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Helper methods
   */

  private determineWordComplexity(word: string): LanguageLevel {
    const entry = this.vocabularyDatabase.get(word.toLowerCase());
    if (entry) {
      return entry.level;
    }

    // Fallback heuristics
    if (word.length <= 3) return 'beginner';
    if (word.length <= 5) return 'elementary';
    if (word.length <= 7) return 'intermediate';
    if (word.length <= 9) return 'upper-intermediate';
    if (word.length <= 12) return 'advanced';
    return 'proficient';
  }

  private determineEntityComplexity(text: string, type: string): 'basic' | 'intermediate' | 'advanced' {
    if (type === 'PERSON' || type === 'LOCATION') return 'basic';
    if (type === 'ORGANIZATION' || type === 'DATE') return 'intermediate';
    return 'advanced';
  }

  private calculatePhraseRelevance(phrase: string): number {
    // Simple heuristic based on phrase length and common words
    const words = phrase.split(' ');
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at'];
    const contentWords = words.filter(word => !commonWords.includes(word.toLowerCase()));
    
    return Math.min(1, contentWords.length / words.length);
  }

  private isWordTooComplex(word: string, targetLevel: LanguageLevel): boolean {
    const wordLevel = this.determineWordComplexity(word);
    const levelOrder = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced', 'proficient'];
    
    const wordIndex = levelOrder.indexOf(wordLevel);
    const targetIndex = levelOrder.indexOf(targetLevel);
    
    return wordIndex > targetIndex + 1; // Allow one level above target
  }

  private isContentWord(word: string): boolean {
    const functionWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return !functionWords.includes(word.toLowerCase()) && word.length > 2;
  }

  private isAppropriateForContext(word: string, topic: string, focusAreas: VocabularyFocusArea[]): boolean {
    // Simple heuristic - in a real implementation, this would use more sophisticated matching
    const topicWords = topic.toLowerCase().split(' ');
    return topicWords.some(topicWord => word.toLowerCase().includes(topicWord)) || 
           this.isGenerallyAppropriate(word, focusAreas);
  }

  private isGenerallyAppropriate(word: string, focusAreas: VocabularyFocusArea[]): boolean {
    // Default to appropriate for general conversation
    return true;
  }

  private getSimplerAlternatives(word: string): string[] {
    const entry = this.vocabularyDatabase.get(word.toLowerCase());
    return entry?.simpler || [];
  }

  private getAdvancedAlternatives(word: string): string[] {
    const entry = this.vocabularyDatabase.get(word.toLowerCase());
    return entry?.advanced || [];
  }

  private getSynonyms(word: string): string[] {
    const entry = this.vocabularyDatabase.get(word.toLowerCase());
    return entry?.synonyms || [];
  }

  private getAllAlternatives(word: string, targetLevel: LanguageLevel): string[] {
    const entry = this.vocabularyDatabase.get(word.toLowerCase());
    if (!entry) return [];

    const alternatives = [...(entry.synonyms || [])];
    
    if (this.isWordTooComplex(word, targetLevel)) {
      alternatives.push(...(entry.simpler || []));
    } else {
      alternatives.push(...(entry.advanced || []));
    }

    return [...new Set(alternatives)].slice(0, 3);
  }

  private calculateWordAppropriatenessScore(word: string, topic: string): number {
    // Simple scoring based on word relevance to topic
    return Math.random() * 0.3 + 0.7; // Placeholder implementation
  }

  private findWordPosition(text: string, word: string, wordIndex: number): { start: number; end: number } {
    const words = text.split(/\s+/);
    let position = 0;
    
    for (let i = 0; i < wordIndex && i < words.length; i++) {
      position = text.indexOf(words[i], position) + words[i].length;
    }
    
    const start = text.indexOf(word, position);
    return {
      start: start >= 0 ? start : 0,
      end: start >= 0 ? start + word.length : word.length
    };
  }

  private scoreToLevel(score: number): LanguageLevel {
    if (score <= 1.5) return 'beginner';
    if (score <= 2.5) return 'elementary';
    if (score <= 3.5) return 'intermediate';
    if (score <= 4.5) return 'upper-intermediate';
    if (score <= 5.5) return 'advanced';
    return 'proficient';
  }

  private calculateConfidence(comprehendAnalysis: any, bedrockAnalysis: any): number {
    let confidence = comprehendAnalysis.confidence || 0.7;
    
    if (bedrockAnalysis && bedrockAnalysis.vocabularyScore) {
      confidence = (confidence + 0.8) / 2;
    }
    
    return Math.round(confidence * 100) / 100;
  }

  private buildBedrockVocabularyPrompt(
    text: string,
    context: ConversationContext,
    comprehendAnalysis: any,
    config: VocabularyAnalysisConfig
  ): string {
    const userLevel = context.userProfile?.currentLevel || 'intermediate';
    const topic = context.currentTopic || 'general conversation';

    return `
As an expert vocabulary teacher, analyze this student text for vocabulary usage and provide suggestions:

Student Text: "${text}"
Student Level: ${userLevel}
Target Level: ${config.targetLevel}
Conversation Topic: ${topic}
Focus Areas: ${config.focusAreas.join(', ')}

Detected Entities: ${JSON.stringify(comprehendAnalysis.entities.slice(0, 5))}
Key Phrases: ${JSON.stringify(comprehendAnalysis.keyPhrases.slice(0, 5))}

Please provide analysis in this JSON format:
{
  "vocabularyScore": 0.75,
  "suggestions": [
    {
      "type": "synonym|simpler|more-advanced|context-appropriate",
      "original": "word",
      "suggested": ["alternative1", "alternative2"],
      "explanation": "Why this suggestion helps",
      "confidence": 0.8,
      "position": {"start": 0, "end": 4}
    }
  ],
  "alternatives": [
    {
      "original": "word",
      "alternatives": ["alt1", "alt2"],
      "context": "explanation of when to use",
      "difficulty": "intermediate",
      "appropriateness": 0.9
    }
  ],
  "contextualFeedback": [
    "Specific vocabulary feedback for this context"
  ]
}

Focus on:
1. Vocabulary appropriateness for the topic and level
2. Word choice variety and sophistication
3. Context-specific terminology usage
4. Constructive suggestions for improvement
`;
  }

  private parseBedrockVocabularyResponse(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        vocabularyScore: 0.7,
        suggestions: [],
        alternatives: [],
        contextualFeedback: []
      };
    } catch (error) {
      console.error('Error parsing Bedrock vocabulary response:', error);
      return {
        vocabularyScore: 0.7,
        suggestions: [],
        alternatives: [],
        contextualFeedback: []
      };
    }
  }

  private initializeVocabularyDatabase(): Map<string, VocabularyEntry> {
    const database = new Map<string, VocabularyEntry>();
    
    // Sample vocabulary entries (in a real implementation, this would be loaded from a comprehensive database)
    const entries: VocabularyEntry[] = [
      {
        word: 'good',
        level: 'beginner',
        synonyms: ['nice', 'great', 'fine'],
        advanced: ['excellent', 'outstanding', 'superb'],
        simpler: []
      },
      {
        word: 'excellent',
        level: 'intermediate',
        synonyms: ['outstanding', 'superb', 'exceptional'],
        advanced: ['exemplary', 'superlative'],
        simpler: ['good', 'great', 'nice']
      },
      {
        word: 'big',
        level: 'beginner',
        synonyms: ['large', 'huge'],
        advanced: ['enormous', 'colossal', 'immense'],
        simpler: []
      },
      {
        word: 'happy',
        level: 'beginner',
        synonyms: ['glad', 'pleased'],
        advanced: ['elated', 'euphoric', 'jubilant'],
        simpler: []
      },
      {
        word: 'think',
        level: 'elementary',
        synonyms: ['believe', 'consider'],
        advanced: ['contemplate', 'ponder', 'deliberate'],
        simpler: ['know']
      }
    ];

    entries.forEach(entry => {
      database.set(entry.word, entry);
    });

    return database;
  }
}

interface VocabularyEntry {
  word: string;
  level: LanguageLevel;
  synonyms: string[];
  advanced: string[];
  simpler: string[];
}