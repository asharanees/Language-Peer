"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrammarAnalyzer = void 0;
const client_comprehend_1 = require("@aws-sdk/client-comprehend");
const bedrock_client_1 = require("../services/bedrock-client");
class GrammarAnalyzer {
    constructor(region) {
        this.comprehendClient = new client_comprehend_1.ComprehendClient({
            region: region || process.env.AWS_REGION || 'us-east-1'
        });
        this.bedrockClient = new bedrock_client_1.BedrockClient(region);
        this.grammarRules = this.initializeGrammarRules();
    }
    /**
     * Analyze grammar using Comprehend syntax analysis and Bedrock reasoning
     */
    async analyzeGrammar(text, context, config = {
        languageCode: 'en',
        enableContextualAnalysis: true,
        strictnessLevel: 'moderate',
        focusAreas: ['grammar', 'syntax']
    }) {
        try {
            // Step 1: Basic syntax analysis with Comprehend
            const syntaxAnalysis = await this.analyzeSyntaxWithComprehend(text, config.languageCode);
            // Step 2: Rule-based grammar checking
            const ruleBasedErrors = this.applyGrammarRules(text, config);
            // Step 3: Enhanced contextual analysis with Bedrock (if enabled)
            let contextualAnalysis = null;
            if (config.enableContextualAnalysis) {
                contextualAnalysis = await this.analyzeWithBedrock(text, context, syntaxAnalysis);
            }
            // Step 4: Combine and prioritize errors
            const allErrors = this.combineAndPrioritizeErrors(ruleBasedErrors, contextualAnalysis?.errors || [], config.strictnessLevel);
            // Step 5: Generate improvement suggestions
            const suggestions = await this.generateImprovementSuggestions(text, allErrors, contextualAnalysis, context);
            // Step 6: Calculate overall grammar score
            const grammarScore = this.calculateGrammarScore(text, allErrors, config.strictnessLevel);
            return {
                grammarScore,
                fluencyScore: contextualAnalysis?.fluencyScore || this.estimateFluency(text, allErrors),
                vocabularyScore: contextualAnalysis?.vocabularyScore || this.estimateVocabulary(text, context),
                pronunciationScore: 0, // Will be calculated by separate service
                errors: allErrors,
                suggestions,
                confidence: this.calculateConfidence(syntaxAnalysis, contextualAnalysis),
                analysisTimestamp: new Date()
            };
        }
        catch (error) {
            console.error('Error analyzing grammar:', error);
            throw new Error(`Grammar analysis failed: ${error}`);
        }
    }
    /**
     * Analyze syntax using Amazon Comprehend
     */
    async analyzeSyntaxWithComprehend(text, languageCode) {
        try {
            // Detect syntax
            const syntaxCommand = new client_comprehend_1.DetectSyntaxCommand({
                Text: text,
                LanguageCode: languageCode
            });
            const syntaxResponse = await this.comprehendClient.send(syntaxCommand);
            // Detect entities for context
            const entitiesCommand = new client_comprehend_1.DetectEntitiesCommand({
                Text: text,
                LanguageCode: languageCode
            });
            const entitiesResponse = await this.comprehendClient.send(entitiesCommand);
            // Convert to our format
            const tokens = (syntaxResponse.SyntaxTokens || []).map(token => ({
                text: token.Text || '',
                partOfSpeech: token.PartOfSpeech?.Tag || 'UNKNOWN',
                beginOffset: token.BeginOffset || 0,
                endOffset: token.EndOffset || 0
            }));
            const entities = entitiesResponse.Entities || [];
            // Calculate confidence based on Comprehend scores
            const avgConfidence = tokens.length > 0 ?
                tokens.reduce((sum, token) => sum + token.confidence || 0.8, 0) / tokens.length : 0.8;
            return {
                tokens,
                entities,
                confidence: avgConfidence
            };
        }
        catch (error) {
            console.error('Error with Comprehend syntax analysis:', error);
            return {
                tokens: [],
                entities: [],
                confidence: 0.5
            };
        }
    }
    /**
     * Enhanced contextual analysis using Bedrock
     */
    async analyzeWithBedrock(text, context, syntaxAnalysis) {
        try {
            const prompt = this.buildBedrockAnalysisPrompt(text, context, syntaxAnalysis);
            const response = await this.bedrockClient.invokeModel({
                modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
                body: {
                    anthropic_version: 'bedrock-2023-05-31',
                    max_tokens: 1000,
                    messages: [{
                            role: 'user',
                            content: prompt
                        }]
                }
            });
            // Parse Bedrock response
            const analysis = this.parseBedrockResponse(response.content);
            return {
                errors: analysis.errors || [],
                fluencyScore: analysis.fluencyScore || 0.7,
                vocabularyScore: analysis.vocabularyScore || 0.7,
                contextualFeedback: analysis.contextualFeedback || []
            };
        }
        catch (error) {
            console.error('Error with Bedrock contextual analysis:', error);
            return {
                errors: [],
                fluencyScore: 0.7,
                vocabularyScore: 0.7,
                contextualFeedback: []
            };
        }
    }
    /**
     * Apply rule-based grammar checking
     */
    applyGrammarRules(text, config) {
        const errors = [];
        // Filter rules based on focus areas
        const applicableRules = this.grammarRules.filter(rule => config.focusAreas.includes(rule.errorType));
        for (const rule of applicableRules) {
            const matches = text.matchAll(rule.pattern);
            for (const match of matches) {
                if (match.index !== undefined) {
                    // Adjust severity based on strictness level
                    let severity = rule.severity;
                    if (config.strictnessLevel === 'lenient' && severity === 'low') {
                        continue; // Skip low severity errors in lenient mode
                    }
                    if (config.strictnessLevel === 'strict' && severity === 'low') {
                        severity = 'medium'; // Upgrade severity in strict mode
                    }
                    errors.push({
                        type: rule.errorType,
                        description: rule.description,
                        severity,
                        position: {
                            start: match.index,
                            end: match.index + match[0].length
                        },
                        suggestion: rule.suggestion
                    });
                }
            }
        }
        return errors;
    }
    /**
     * Combine and prioritize errors from different sources
     */
    combineAndPrioritizeErrors(ruleBasedErrors, contextualErrors, strictnessLevel) {
        // Combine all errors
        const allErrors = [...ruleBasedErrors, ...contextualErrors];
        // Remove duplicates (errors at same position)
        const uniqueErrors = allErrors.filter((error, index, array) => array.findIndex(e => e.position.start === error.position.start &&
            e.position.end === error.position.end) === index);
        // Sort by severity and position
        uniqueErrors.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0)
                return severityDiff;
            return a.position.start - b.position.start;
        });
        // Limit number of errors based on strictness
        const maxErrors = strictnessLevel === 'strict' ? 10 : strictnessLevel === 'moderate' ? 7 : 5;
        return uniqueErrors.slice(0, maxErrors);
    }
    /**
     * Generate improvement suggestions
     */
    async generateImprovementSuggestions(text, errors, contextualAnalysis, context) {
        const suggestions = [];
        // Generate suggestions from errors
        for (const error of errors.slice(0, 3)) { // Top 3 errors
            const originalText = text.substring(error.position.start, error.position.end);
            suggestions.push({
                category: error.type === 'syntax' ? 'grammar' : error.type,
                original: originalText,
                suggested: error.suggestion,
                explanation: error.description,
                confidence: 0.8
            });
        }
        // Add contextual suggestions from Bedrock
        if (contextualAnalysis?.contextualFeedback) {
            for (const feedback of contextualAnalysis.contextualFeedback.slice(0, 2)) {
                suggestions.push({
                    category: 'fluency',
                    original: text,
                    suggested: feedback,
                    explanation: 'Contextual improvement suggestion',
                    confidence: 0.7
                });
            }
        }
        return suggestions;
    }
    /**
     * Calculate overall grammar score
     */
    calculateGrammarScore(text, errors, strictnessLevel) {
        if (text.length === 0)
            return 0;
        const wordCount = text.split(/\s+/).length;
        const errorWeight = { high: 3, medium: 2, low: 1 };
        // Calculate error penalty
        const totalErrorWeight = errors.reduce((sum, error) => sum + errorWeight[error.severity], 0);
        // Base score calculation
        const errorRate = totalErrorWeight / Math.max(wordCount, 1);
        let score = Math.max(0, 1 - errorRate * 0.2);
        // Adjust for strictness level
        if (strictnessLevel === 'lenient') {
            score = Math.min(1, score + 0.1);
        }
        else if (strictnessLevel === 'strict') {
            score = Math.max(0, score - 0.1);
        }
        return Math.round(score * 100) / 100;
    }
    /**
     * Estimate fluency score
     */
    estimateFluency(text, errors) {
        const wordCount = text.split(/\s+/).length;
        const sentenceCount = text.split(/[.!?]+/).length;
        // Basic fluency metrics
        const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
        const fluencyErrors = errors.filter(e => e.type === 'fluency').length;
        let score = 0.7; // Base score
        // Adjust for sentence length (optimal range: 10-20 words)
        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
            score += 0.1;
        }
        else if (avgWordsPerSentence < 5 || avgWordsPerSentence > 30) {
            score -= 0.1;
        }
        // Adjust for fluency errors
        score -= fluencyErrors * 0.05;
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Estimate vocabulary score
     */
    estimateVocabulary(text, context) {
        const words = text.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        const vocabularyDiversity = uniqueWords.size / Math.max(words.length, 1);
        // Check for advanced vocabulary (simple heuristic)
        const advancedWords = words.filter(word => word.length > 6).length;
        const advancedRatio = advancedWords / Math.max(words.length, 1);
        let score = vocabularyDiversity * 0.6 + advancedRatio * 0.4;
        // Adjust based on user level from context
        if (context.userProfile?.currentLevel) {
            const levelMultiplier = {
                'beginner': 0.8,
                'elementary': 0.85,
                'intermediate': 0.9,
                'upper-intermediate': 0.95,
                'advanced': 1.0,
                'proficient': 1.0
            };
            score *= levelMultiplier[context.userProfile.currentLevel] || 0.9;
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * Calculate analysis confidence
     */
    calculateConfidence(syntaxAnalysis, contextualAnalysis) {
        let confidence = syntaxAnalysis.confidence || 0.7;
        if (contextualAnalysis) {
            // Higher confidence when we have contextual analysis
            confidence = (confidence + 0.9) / 2;
        }
        return Math.round(confidence * 100) / 100;
    }
    /**
     * Build prompt for Bedrock analysis
     */
    buildBedrockAnalysisPrompt(text, context, syntaxAnalysis) {
        const userLevel = context.userProfile?.currentLevel || 'intermediate';
        const conversationTopic = context.currentTopic || 'general conversation';
        return `
As an expert language teacher, analyze this student text for grammar, fluency, and vocabulary:

Student Text: "${text}"
Student Level: ${userLevel}
Conversation Topic: ${conversationTopic}
Syntax Tokens: ${JSON.stringify(syntaxAnalysis.tokens.slice(0, 10))}

Please provide analysis in this JSON format:
{
  "errors": [
    {
      "type": "grammar|vocabulary|syntax|fluency",
      "description": "Clear explanation of the error",
      "severity": "low|medium|high",
      "position": {"start": 0, "end": 5},
      "suggestion": "Corrected version"
    }
  ],
  "fluencyScore": 0.85,
  "vocabularyScore": 0.75,
  "contextualFeedback": [
    "Specific improvement suggestions based on context"
  ]
}

Focus on:
1. Grammar accuracy and sentence structure
2. Vocabulary appropriateness for the topic and level
3. Natural flow and fluency
4. Constructive, encouraging feedback
`;
    }
    /**
     * Parse Bedrock response
     */
    parseBedrockResponse(content) {
        try {
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            // Fallback parsing if JSON is not properly formatted
            return {
                errors: [],
                fluencyScore: 0.7,
                vocabularyScore: 0.7,
                contextualFeedback: []
            };
        }
        catch (error) {
            console.error('Error parsing Bedrock response:', error);
            return {
                errors: [],
                fluencyScore: 0.7,
                vocabularyScore: 0.7,
                contextualFeedback: []
            };
        }
    }
    /**
     * Initialize grammar rules
     */
    initializeGrammarRules() {
        return [
            {
                id: 'subject-verb-agreement',
                name: 'Subject-Verb Agreement',
                description: 'Subject and verb must agree in number',
                pattern: /\b(I|you|we|they)\s+(is|was)\b/gi,
                errorType: 'grammar',
                severity: 'high',
                suggestion: 'Use "are" or "were" with plural subjects'
            },
            {
                id: 'article-usage',
                name: 'Article Usage',
                description: 'Incorrect article usage',
                pattern: /\b(a)\s+[aeiou]/gi,
                errorType: 'grammar',
                severity: 'medium',
                suggestion: 'Use "an" before vowel sounds'
            },
            {
                id: 'double-negative',
                name: 'Double Negative',
                description: 'Avoid double negatives',
                pattern: /\b(don\'t|doesn\'t|didn\'t|won\'t|can\'t)\s+\w*\s+(no|nothing|nobody|never)\b/gi,
                errorType: 'grammar',
                severity: 'medium',
                suggestion: 'Use only one negative in a sentence'
            },
            {
                id: 'sentence-fragment',
                name: 'Sentence Fragment',
                description: 'Incomplete sentence',
                pattern: /^[A-Z][a-z]*\s+(and|but|or|because|since|although)\s*\.$/gm,
                errorType: 'syntax',
                severity: 'high',
                suggestion: 'Complete the sentence with a main clause'
            },
            {
                id: 'run-on-sentence',
                name: 'Run-on Sentence',
                description: 'Sentence is too long without proper punctuation',
                pattern: /[^.!?]{100,}/g,
                errorType: 'syntax',
                severity: 'low',
                suggestion: 'Break into shorter sentences or add punctuation'
            }
        ];
    }
}
exports.GrammarAnalyzer = GrammarAnalyzer;
