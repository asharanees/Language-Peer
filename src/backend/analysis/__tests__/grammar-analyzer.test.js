"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grammar_analyzer_1 = require("../grammar-analyzer");
const client_comprehend_1 = require("@aws-sdk/client-comprehend");
const bedrock_client_1 = require("../../services/bedrock-client");
// Mock AWS SDK
jest.mock('@aws-sdk/client-comprehend');
jest.mock('../../services/bedrock-client');
describe('GrammarAnalyzer', () => {
    let grammarAnalyzer;
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
        grammarAnalyzer = new grammar_analyzer_1.GrammarAnalyzer('us-east-1');
        grammarAnalyzer.comprehendClient = mockComprehendClient;
        grammarAnalyzer.bedrockClient = mockBedrockClient;
        // Mock context
        const mockUserProfile = {
            userId: 'test-user-123',
            targetLanguage: 'en-US',
            nativeLanguage: 'es-ES',
            currentLevel: 'intermediate',
            learningGoals: ['grammar-accuracy'],
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
            enableContextualAnalysis: true,
            strictnessLevel: 'moderate',
            focusAreas: ['grammar', 'syntax']
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('analyzeGrammar', () => {
        test('analyzes grammar successfully with Comprehend and Bedrock', async () => {
            const testText = 'I are going to the store yesterday.';
            // Mock Comprehend responses
            const mockSyntaxResponse = {
                SyntaxTokens: [
                    { Text: 'I', PartOfSpeech: { Tag: 'PRON' }, BeginOffset: 0, EndOffset: 1 },
                    { Text: 'are', PartOfSpeech: { Tag: 'VERB' }, BeginOffset: 2, EndOffset: 5 },
                    { Text: 'going', PartOfSpeech: { Tag: 'VERB' }, BeginOffset: 6, EndOffset: 11 },
                    { Text: 'to', PartOfSpeech: { Tag: 'ADP' }, BeginOffset: 12, EndOffset: 14 },
                    { Text: 'the', PartOfSpeech: { Tag: 'DET' }, BeginOffset: 15, EndOffset: 18 },
                    { Text: 'store', PartOfSpeech: { Tag: 'NOUN' }, BeginOffset: 19, EndOffset: 24 },
                    { Text: 'yesterday', PartOfSpeech: { Tag: 'ADV' }, BeginOffset: 25, EndOffset: 34 }
                ]
            };
            const mockEntitiesResponse = {
                Entities: []
            };
            // Mock Bedrock response
            const mockBedrockResponse = {
                content: JSON.stringify({
                    errors: [
                        {
                            type: 'grammar',
                            description: 'Subject-verb disagreement: "I" should be followed by "am" not "are"',
                            severity: 'high',
                            position: { start: 2, end: 5 },
                            suggestion: 'Use "am" with "I"'
                        }
                    ],
                    fluencyScore: 0.6,
                    vocabularyScore: 0.8,
                    contextualFeedback: ['Consider using past tense consistently throughout the sentence']
                })
            };
            mockComprehendClient.send
                .mockResolvedValueOnce(mockSyntaxResponse) // DetectSyntaxCommand
                .mockResolvedValueOnce(mockEntitiesResponse); // DetectEntitiesCommand
            mockBedrockClient.invokeModel.mockResolvedValue(mockBedrockResponse);
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, mockConfig);
            expect(result.grammarScore).toBeLessThan(1.0);
            expect(result.errors).toHaveLength(2); // Rule-based + Bedrock error
            expect(result.errors[0].type).toBe('grammar');
            expect(result.suggestions).toHaveLength(2);
            expect(result.confidence).toBeGreaterThan(0);
            expect(mockComprehendClient.send).toHaveBeenCalledTimes(2);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledTimes(1);
        });
        test('handles Comprehend service errors gracefully', async () => {
            const testText = 'This is a test sentence.';
            mockComprehendClient.send.mockRejectedValue(new Error('Comprehend service error'));
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, mockConfig);
            expect(result.grammarScore).toBeGreaterThan(0);
            expect(result.confidence).toBe(0.7); // Default when no Comprehend data
            expect(result.errors).toHaveLength(0); // No rule-based errors in this sentence
        });
        test('handles Bedrock service errors gracefully', async () => {
            const testText = 'This is a test sentence.';
            mockComprehendClient.send
                .mockResolvedValueOnce({ SyntaxTokens: [] })
                .mockResolvedValueOnce({ Entities: [] });
            mockBedrockClient.invokeModel.mockRejectedValue(new Error('Bedrock service error'));
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, mockConfig);
            expect(result.grammarScore).toBeGreaterThan(0);
            expect(result.fluencyScore).toBe(0.7); // Estimated value
            expect(result.vocabularyScore).toBeGreaterThan(0);
        });
        test('applies different strictness levels correctly', async () => {
            const testText = 'I are going to store.'; // Multiple errors
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    errors: [],
                    fluencyScore: 0.7,
                    vocabularyScore: 0.7,
                    contextualFeedback: []
                })
            });
            // Test lenient mode
            const lenientConfig = { ...mockConfig, strictnessLevel: 'lenient' };
            const lenientResult = await grammarAnalyzer.analyzeGrammar(testText, mockContext, lenientConfig);
            // Test strict mode
            const strictConfig = { ...mockConfig, strictnessLevel: 'strict' };
            const strictResult = await grammarAnalyzer.analyzeGrammar(testText, mockContext, strictConfig);
            expect(strictResult.grammarScore).toBeLessThanOrEqual(lenientResult.grammarScore);
        });
        test('focuses on specified error types', async () => {
            const testText = 'I are going to a store yesterday.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    errors: [],
                    fluencyScore: 0.7,
                    vocabularyScore: 0.7,
                    contextualFeedback: []
                })
            });
            // Test with only grammar focus
            const grammarOnlyConfig = { ...mockConfig, focusAreas: ['grammar'] };
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, grammarOnlyConfig);
            // Should detect subject-verb agreement error but not article usage
            const grammarErrors = result.errors.filter(e => e.type === 'grammar');
            expect(grammarErrors.length).toBeGreaterThan(0);
        });
        test('disables contextual analysis when configured', async () => {
            const testText = 'This is a test sentence.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            await grammarAnalyzer.analyzeGrammar(testText, mockContext, noContextConfig);
            expect(mockBedrockClient.invokeModel).not.toHaveBeenCalled();
        });
    });
    describe('rule-based grammar checking', () => {
        test('detects subject-verb agreement errors', async () => {
            const testText = 'I are happy and you is sad.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, noContextConfig);
            const agreementErrors = result.errors.filter(e => e.description.includes('Subject and verb must agree'));
            expect(agreementErrors.length).toBeGreaterThan(0);
        });
        test('detects article usage errors', async () => {
            const testText = 'I saw a elephant at a zoo.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, noContextConfig);
            const articleErrors = result.errors.filter(e => e.description.includes('article usage'));
            expect(articleErrors.length).toBeGreaterThan(0);
        });
        test('detects double negatives', async () => {
            const testText = "I don't know nothing about that.";
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, noContextConfig);
            const doubleNegErrors = result.errors.filter(e => e.description.includes('double negative'));
            expect(doubleNegErrors.length).toBeGreaterThan(0);
        });
        test('detects run-on sentences', async () => {
            const testText = 'This is a very long sentence that goes on and on without any proper punctuation and it just keeps going and going until it becomes really hard to follow what the speaker is trying to say because there are no breaks or pauses in the sentence structure.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, noContextConfig);
            const runOnErrors = result.errors.filter(e => e.description.includes('too long'));
            expect(runOnErrors.length).toBeGreaterThan(0);
        });
    });
    describe('scoring algorithms', () => {
        test('calculates grammar score based on error count and severity', async () => {
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            // Test with no errors
            const perfectText = 'This is a perfect sentence.';
            const perfectResult = await grammarAnalyzer.analyzeGrammar(perfectText, mockContext, noContextConfig);
            expect(perfectResult.grammarScore).toBeGreaterThan(0.9);
            // Test with errors
            const errorText = 'I are going to a store.';
            const errorResult = await grammarAnalyzer.analyzeGrammar(errorText, mockContext, noContextConfig);
            expect(errorResult.grammarScore).toBeLessThan(perfectResult.grammarScore);
        });
        test('estimates fluency based on sentence structure', async () => {
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            // Test with good sentence structure
            const fluentText = 'I enjoy reading books in the evening. It helps me relax after work.';
            const fluentResult = await grammarAnalyzer.analyzeGrammar(fluentText, mockContext, noContextConfig);
            // Test with poor sentence structure
            const choppyText = 'I read. Books. Evening. Relax.';
            const choppyResult = await grammarAnalyzer.analyzeGrammar(choppyText, mockContext, noContextConfig);
            expect(fluentResult.fluencyScore).toBeGreaterThan(choppyResult.fluencyScore);
        });
        test('estimates vocabulary based on word diversity and complexity', async () => {
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            // Test with diverse vocabulary
            const diverseText = 'I thoroughly enjoyed the magnificent performance at the theater.';
            const diverseResult = await grammarAnalyzer.analyzeGrammar(diverseText, mockContext, noContextConfig);
            // Test with simple vocabulary
            const simpleText = 'I like the good show at the place.';
            const simpleResult = await grammarAnalyzer.analyzeGrammar(simpleText, mockContext, noContextConfig);
            expect(diverseResult.vocabularyScore).toBeGreaterThan(simpleResult.vocabularyScore);
        });
        test('adjusts scores based on user level', async () => {
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            // Test with beginner user
            const beginnerContext = {
                ...mockContext,
                userProfile: { ...mockContext.userProfile, currentLevel: 'beginner' }
            };
            // Test with advanced user
            const advancedContext = {
                ...mockContext,
                userProfile: { ...mockContext.userProfile, currentLevel: 'advanced' }
            };
            const testText = 'I like books.';
            const beginnerResult = await grammarAnalyzer.analyzeGrammar(testText, beginnerContext, noContextConfig);
            const advancedResult = await grammarAnalyzer.analyzeGrammar(testText, advancedContext, noContextConfig);
            // Beginner should get higher vocabulary score for simple text
            expect(beginnerResult.vocabularyScore).toBeGreaterThanOrEqual(advancedResult.vocabularyScore);
        });
    });
    describe('error prioritization and suggestions', () => {
        test('prioritizes high severity errors', async () => {
            const testText = 'I are going to a elephant.'; // Multiple errors
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, noContextConfig);
            // First error should be high severity (subject-verb agreement)
            expect(result.errors[0].severity).toBe('high');
        });
        test('generates appropriate improvement suggestions', async () => {
            const testText = 'I are happy.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const noContextConfig = { ...mockConfig, enableContextualAnalysis: false };
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, noContextConfig);
            expect(result.suggestions.length).toBeGreaterThan(0);
            expect(result.suggestions[0].category).toBe('grammar');
            expect(result.suggestions[0].original).toBe('are');
            expect(result.suggestions[0].explanation).toContain('Subject and verb must agree');
        });
        test('limits number of errors based on strictness', async () => {
            // Create text with many errors
            const errorText = 'I are going to a elephant and you is coming to a university and we was happy and they was sad.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const lenientConfig = { ...mockConfig, strictnessLevel: 'lenient', enableContextualAnalysis: false };
            const strictConfig = { ...mockConfig, strictnessLevel: 'strict', enableContextualAnalysis: false };
            const lenientResult = await grammarAnalyzer.analyzeGrammar(errorText, mockContext, lenientConfig);
            const strictResult = await grammarAnalyzer.analyzeGrammar(errorText, mockContext, strictConfig);
            expect(lenientResult.errors.length).toBeLessThanOrEqual(5); // Lenient limit
            expect(strictResult.errors.length).toBeLessThanOrEqual(10); // Strict limit
        });
    });
    describe('Bedrock integration', () => {
        test('builds appropriate prompt for Bedrock analysis', async () => {
            const testText = 'I am learning English.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [{ Text: 'I', PartOfSpeech: { Tag: 'PRON' } }] })
                .mockResolvedValue({ Entities: [] });
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    errors: [],
                    fluencyScore: 0.9,
                    vocabularyScore: 0.8,
                    contextualFeedback: []
                })
            });
            await grammarAnalyzer.analyzeGrammar(testText, mockContext, mockConfig);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
                modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
                body: {
                    anthropic_version: 'bedrock-2023-05-31',
                    max_tokens: 1000,
                    messages: [{
                            role: 'user',
                            content: expect.stringContaining('Student Text: "I am learning English."')
                        }]
                }
            });
            const prompt = mockBedrockClient.invokeModel.mock.calls[0][0].body.messages[0].content;
            expect(prompt).toContain('Student Level: intermediate');
            expect(prompt).toContain('Conversation Topic: Travel and Culture');
        });
        test('parses Bedrock response correctly', async () => {
            const testText = 'I am learning English.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            const bedrockResponse = {
                content: JSON.stringify({
                    errors: [
                        {
                            type: 'vocabulary',
                            description: 'Consider using more advanced vocabulary',
                            severity: 'low',
                            position: { start: 5, end: 13 },
                            suggestion: 'studying'
                        }
                    ],
                    fluencyScore: 0.85,
                    vocabularyScore: 0.75,
                    contextualFeedback: ['Great sentence structure!']
                })
            };
            mockBedrockClient.invokeModel.mockResolvedValue(bedrockResponse);
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, mockConfig);
            expect(result.fluencyScore).toBe(0.85);
            expect(result.vocabularyScore).toBe(0.75);
            expect(result.errors.some(e => e.type === 'vocabulary')).toBe(true);
        });
        test('handles malformed Bedrock responses', async () => {
            const testText = 'I am learning English.';
            mockComprehendClient.send
                .mockResolvedValue({ SyntaxTokens: [] })
                .mockResolvedValue({ Entities: [] });
            // Malformed JSON response
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: 'This is not valid JSON {malformed'
            });
            const result = await grammarAnalyzer.analyzeGrammar(testText, mockContext, mockConfig);
            // Should handle gracefully with default values
            expect(result.fluencyScore).toBe(0.7);
            expect(result.vocabularyScore).toBeGreaterThan(0);
            expect(result.confidence).toBeGreaterThan(0);
        });
    });
});
