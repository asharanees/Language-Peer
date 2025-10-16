"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vocabulary_analyzer_1 = require("../vocabulary-analyzer");
const client_comprehend_1 = require("@aws-sdk/client-comprehend");
const bedrock_client_1 = require("../../services/bedrock-client");
// Mock AWS SDK
jest.mock('@aws-sdk/client-comprehend');
jest.mock('../../services/bedrock-client');
describe('VocabularyAnalyzer', () => {
    let vocabularyAnalyzer;
    let mockComprehendClient;
    let mockBedrockClient;
    let mockContext;
    let mockConfig;
    beforeEach(() => {
        // Setup mocks
        mockComprehendClient = {
            send: jest.fn()
        };
        mockBedrockClient = {
            invokeModel: jest.fn()
        };
        client_comprehend_1.ComprehendClient.mockImplementation(() => mockComprehendClient);
        bedrock_client_1.BedrockClient.mockImplementation(() => mockBedrockClient);
        // Create analyzer instance
        vocabularyAnalyzer = new vocabulary_analyzer_1.VocabularyAnalyzer('us-east-1');
        vocabularyAnalyzer.comprehendClient = mockComprehendClient;
        vocabularyAnalyzer.bedrockClient = mockBedrockClient;
        // Mock context
        const mockUserProfile = {
            userId: 'test-user-123',
            targetLanguage: 'en-US',
            nativeLanguage: 'es-ES',
            currentLevel: 'intermediate',
            learningGoals: ['vocabulary-expansion'],
            preferredAgents: [],
            conversationTopics: ['Travel and Culture'],
            progressMetrics: {
                overallImprovement: 0.7,
                grammarProgress: 0.6,
                fluencyProgress: 0.8,
                vocabularyGrowth: 0.5,
                confidenceLevel: 0.7,
                sessionsCompleted: 5,
                totalPracticeTime: 3600,
                streakDays: 3
            },
            lastSessionDate: new Date(),
            totalSessionTime: 3600,
            milestones: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        mockContext = {
            sessionId: 'test-session-123',
            userId: 'test-user-123',
            conversationHistory: [],
            userProfile: mockUserProfile,
            currentTopic: 'Travel and Culture'
        };
        mockConfig = {
            languageCode: 'en',
            targetLevel: 'intermediate',
            includeEntityAnalysis: true,
            includeSynonymSuggestions: true,
            includeComplexityAnalysis: true,
            focusAreas: ['casual', 'business']
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('analyzeVocabulary', () => {
        test('analyzes vocabulary successfully with Comprehend and Bedrock', async () => {
            const testText = 'I had an excellent vacation in Paris. The magnificent architecture was breathtaking.';
            // Mock Comprehend responses
            const mockEntitiesResponse = {
                Entities: [
                    { Text: 'Paris', Type: 'LOCATION', Score: 0.95, BeginOffset: 32, EndOffset: 37 }
                ]
            };
            const mockKeyPhrasesResponse = {
                KeyPhrases: [
                    { Text: 'excellent vacation', Score: 0.9, BeginOffset: 9, EndOffset: 27 },
                    { Text: 'magnificent architecture', Score: 0.85, BeginOffset: 43, EndOffset: 67 }
                ]
            };
            // Mock Bedrock response
            const mockBedrockResponse = {
                content: JSON.stringify({
                    vocabularyScore: 0.82,
                    suggestions: [
                        {
                            type: 'synonym',
                            original: 'excellent',
                            suggested: ['outstanding', 'superb'],
                            explanation: 'Add variety with synonyms',
                            confidence: 0.8,
                            position: { start: 9, end: 18 }
                        }
                    ],
                    alternatives: [
                        {
                            original: 'magnificent',
                            alternatives: ['beautiful', 'impressive'],
                            context: 'describing architecture',
                            difficulty: 'intermediate',
                            appropriateness: 0.9
                        }
                    ],
                    contextualFeedback: ['Great use of descriptive vocabulary for travel context']
                })
            };
            mockComprehendClient.send
                .mockResolvedValueOnce(mockEntitiesResponse) // DetectEntitiesCommand
                .mockResolvedValueOnce(mockKeyPhrasesResponse); // DetectKeyPhrasesCommand
            mockBedrockClient.invokeModel.mockResolvedValue(mockBedrockResponse);
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, mockConfig);
            expect(result.vocabularyScore).toBe(0.82);
            expect(result.complexityLevel).toBeDefined();
            expect(result.diversityScore).toBeGreaterThan(0);
            expect(result.entities).toHaveLength(1);
            expect(result.keyPhrases).toHaveLength(2);
            expect(result.suggestions).toHaveLength(1);
            expect(result.alternatives).toHaveLength(1);
            expect(mockComprehendClient.send).toHaveBeenCalledTimes(2);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalled();
        });
        test('handles different complexity levels correctly', async () => {
            const beginnerText = 'I like food. Food is good.';
            const advancedText = 'I thoroughly appreciate the exquisite culinary artistry demonstrated in this establishment.';
            mockComprehendClient.send
                .mockResolvedValue({ Entities: [] })
                .mockResolvedValue({ KeyPhrases: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    vocabularyScore: 0.7,
                    suggestions: [],
                    alternatives: [],
                    contextualFeedback: []
                })
            });
            const beginnerResult = await vocabularyAnalyzer.analyzeVocabulary(beginnerText, mockContext, { ...mockConfig, targetLevel: 'beginner' });
            const advancedResult = await vocabularyAnalyzer.analyzeVocabulary(advancedText, mockContext, { ...mockConfig, targetLevel: 'advanced' });
            expect(beginnerResult.complexityLevel).toBe('beginner');
            expect(advancedResult.complexityLevel).toBe('advanced');
        });
        test('generates appropriate suggestions for different target levels', async () => {
            const testText = 'The big house is very good.';
            mockComprehendClient.send
                .mockResolvedValue({ Entities: [] })
                .mockResolvedValue({ KeyPhrases: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    vocabularyScore: 0.6,
                    suggestions: [],
                    alternatives: [],
                    contextualFeedback: []
                })
            });
            // Test with advanced target level (should suggest more sophisticated words)
            const advancedConfig = { ...mockConfig, targetLevel: 'advanced' };
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, advancedConfig);
            // Should suggest more advanced alternatives for basic words
            expect(result.suggestions.some(s => s.type === 'more-advanced')).toBe(true);
        });
    });
    describe('vocabulary complexity analysis', () => {
        test('correctly identifies word complexity levels', async () => {
            const analyzer = vocabularyAnalyzer;
            expect(analyzer.determineWordComplexity('cat')).toBe('beginner');
            expect(analyzer.determineWordComplexity('house')).toBe('elementary');
            expect(analyzer.determineWordComplexity('beautiful')).toBe('intermediate');
            expect(analyzer.determineWordComplexity('magnificent')).toBe('upper-intermediate');
            expect(analyzer.determineWordComplexity('extraordinary')).toBe('advanced');
        });
        test('calculates diversity score correctly', async () => {
            const analyzer = vocabularyAnalyzer;
            // High diversity text
            const diverseWords = ['unique', 'different', 'various', 'distinct', 'separate'];
            const diverseScore = analyzer.calculateDiversityScore(diverseWords);
            // Low diversity text (repeated words)
            const repetitiveWords = ['good', 'good', 'good', 'nice', 'good'];
            const repetitiveScore = analyzer.calculateDiversityScore(repetitiveWords);
            expect(diverseScore).toBeGreaterThan(repetitiveScore);
        });
        test('assesses appropriateness for context', async () => {
            const analyzer = vocabularyAnalyzer;
            const travelWords = ['journey', 'destination', 'adventure'];
            const businessWords = ['meeting', 'presentation', 'strategy'];
            const travelScore = analyzer.calculateAppropriatenessScore(travelWords, 'Travel and Culture', ['casual']);
            const businessScore = analyzer.calculateAppropriatenessScore(businessWords, 'Business Meeting', ['business']);
            expect(travelScore).toBeGreaterThan(0);
            expect(businessScore).toBeGreaterThan(0);
        });
    });
    describe('suggestion generation', () => {
        test('generates synonym suggestions when enabled', async () => {
            const testText = 'The good book was very nice.';
            mockComprehendClient.send
                .mockResolvedValue({ Entities: [] })
                .mockResolvedValue({ KeyPhrases: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    vocabularyScore: 0.7,
                    suggestions: [],
                    alternatives: [],
                    contextualFeedback: []
                })
            });
            const configWithSynonyms = { ...mockConfig, includeSynonymSuggestions: true };
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, configWithSynonyms);
            expect(result.suggestions.some(s => s.type === 'synonym')).toBe(true);
        });
        test('suggests simpler alternatives for complex words when appropriate', async () => {
            const testText = 'The extraordinary establishment was magnificent.';
            mockComprehendClient.send
                .mockResolvedValue({ Entities: [] })
                .mockResolvedValue({ KeyPhrases: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    vocabularyScore: 0.7,
                    suggestions: [],
                    alternatives: [],
                    contextualFeedback: []
                })
            });
            const beginnerConfig = { ...mockConfig, targetLevel: 'beginner' };
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, beginnerConfig);
            expect(result.suggestions.some(s => s.type === 'simpler')).toBe(true);
        });
        test('limits and prioritizes suggestions by confidence', async () => {
            const testText = 'The good nice great excellent outstanding superb magnificent word.';
            mockComprehendClient.send
                .mockResolvedValue({ Entities: [] })
                .mockResolvedValue({ KeyPhrases: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    vocabularyScore: 0.7,
                    suggestions: [],
                    alternatives: [],
                    contextualFeedback: []
                })
            });
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, mockConfig);
            // Should limit to maximum 5 suggestions
            expect(result.suggestions.length).toBeLessThanOrEqual(5);
            // Should be sorted by confidence (highest first)
            for (let i = 1; i < result.suggestions.length; i++) {
                expect(result.suggestions[i - 1].confidence).toBeGreaterThanOrEqual(result.suggestions[i].confidence);
            }
        });
    });
    describe('entity and key phrase analysis', () => {
        test('processes Comprehend entities correctly', async () => {
            const testText = 'I visited New York and met John Smith at Microsoft.';
            const mockEntitiesResponse = {
                Entities: [
                    { Text: 'New York', Type: 'LOCATION', Score: 0.95, BeginOffset: 10, EndOffset: 18 },
                    { Text: 'John Smith', Type: 'PERSON', Score: 0.90, BeginOffset: 27, EndOffset: 37 },
                    { Text: 'Microsoft', Type: 'ORGANIZATION', Score: 0.85, BeginOffset: 41, EndOffset: 50 }
                ]
            };
            mockComprehendClient.send
                .mockResolvedValueOnce(mockEntitiesResponse)
                .mockResolvedValueOnce({ KeyPhrases: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    vocabularyScore: 0.8,
                    suggestions: [],
                    alternatives: [],
                    contextualFeedback: []
                })
            });
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, mockConfig);
            expect(result.entities).toHaveLength(3);
            expect(result.entities[0].text).toBe('New York');
            expect(result.entities[0].type).toBe('LOCATION');
            expect(result.entities[0].complexity).toBe('basic');
            expect(result.entities[2].complexity).toBe('intermediate'); // Organization
        });
        test('processes key phrases with relevance scoring', async () => {
            const testText = 'The beautiful sunset over the ocean was absolutely breathtaking.';
            const mockKeyPhrasesResponse = {
                KeyPhrases: [
                    { Text: 'beautiful sunset', Score: 0.9, BeginOffset: 4, EndOffset: 20 },
                    { Text: 'the ocean', Score: 0.8, BeginOffset: 26, EndOffset: 35 }
                ]
            };
            mockComprehendClient.send
                .mockResolvedValueOnce({ Entities: [] })
                .mockResolvedValueOnce(mockKeyPhrasesResponse);
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    vocabularyScore: 0.8,
                    suggestions: [],
                    alternatives: [],
                    contextualFeedback: []
                })
            });
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, mockConfig);
            expect(result.keyPhrases).toHaveLength(2);
            expect(result.keyPhrases[0].text).toBe('beautiful sunset');
            expect(result.keyPhrases[0].relevance).toBeGreaterThan(0);
        });
    });
    describe('error handling', () => {
        test('handles Comprehend service errors gracefully', async () => {
            const testText = 'Test sentence.';
            mockComprehendClient.send.mockRejectedValue(new Error('Comprehend service error'));
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    vocabularyScore: 0.7,
                    suggestions: [],
                    alternatives: [],
                    contextualFeedback: []
                })
            });
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, mockConfig);
            expect(result.vocabularyScore).toBeGreaterThan(0);
            expect(result.entities).toHaveLength(0);
            expect(result.keyPhrases).toHaveLength(0);
            expect(result.confidence).toBeLessThan(0.8); // Lower confidence due to error
        });
        test('handles Bedrock service errors gracefully', async () => {
            const testText = 'Test sentence.';
            mockComprehendClient.send
                .mockResolvedValueOnce({ Entities: [] })
                .mockResolvedValueOnce({ KeyPhrases: [] });
            mockBedrockClient.invokeModel.mockRejectedValue(new Error('Bedrock service error'));
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, mockConfig);
            expect(result.vocabularyScore).toBe(0.7); // Fallback score
            expect(result.confidence).toBeLessThan(0.8);
        });
        test('handles malformed Bedrock responses', async () => {
            const testText = 'Test sentence.';
            mockComprehendClient.send
                .mockResolvedValueOnce({ Entities: [] })
                .mockResolvedValueOnce({ KeyPhrases: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: 'Invalid JSON response {malformed'
            });
            const result = await vocabularyAnalyzer.analyzeVocabulary(testText, mockContext, mockConfig);
            expect(result.vocabularyScore).toBe(0.7); // Fallback score
            expect(result.suggestions).toHaveLength(0);
            expect(result.alternatives).toHaveLength(0);
        });
        test('handles empty text input', async () => {
            const result = await vocabularyAnalyzer.analyzeVocabulary('', mockContext, mockConfig);
            expect(result.vocabularyScore).toBe(0);
            expect(result.diversityScore).toBe(0);
            expect(result.entities).toHaveLength(0);
            expect(result.keyPhrases).toHaveLength(0);
        });
    });
    describe('vocabulary database integration', () => {
        test('uses vocabulary database for word analysis', async () => {
            const analyzer = vocabularyAnalyzer;
            const database = analyzer.vocabularyDatabase;
            // Test that database contains expected entries
            expect(database.has('good')).toBe(true);
            expect(database.has('excellent')).toBe(true);
            expect(database.get('good').level).toBe('beginner');
            expect(database.get('excellent').level).toBe('intermediate');
        });
        test('provides alternatives from database', async () => {
            const analyzer = vocabularyAnalyzer;
            const simplerAlts = analyzer.getSimplerAlternatives('excellent');
            const advancedAlts = analyzer.getAdvancedAlternatives('good');
            const synonyms = analyzer.getSynonyms('good');
            expect(simplerAlts).toContain('good');
            expect(advancedAlts).toContain('excellent');
            expect(synonyms).toContain('nice');
        });
    });
});
