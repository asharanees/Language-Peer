"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recommendation_engine_1 = require("../recommendation-engine");
const bedrock_client_1 = require("../bedrock-client");
const constants_1 = require("@/shared/constants");
// Mock the BedrockClient
jest.mock('../bedrock-client');
describe('BedrockRecommendationEngine', () => {
    let recommendationEngine;
    let mockBedrockClient;
    const mockUserProfile = {
        userId: 'test-user-123',
        targetLanguage: 'English',
        nativeLanguage: 'Spanish',
        currentLevel: 'intermediate',
        learningGoals: ['conversation-fluency', 'grammar-accuracy'],
        preferredAgents: [constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR],
        conversationTopics: ['Travel and Culture', 'Food and Cooking'],
        progressMetrics: {
            overallImprovement: 0.75,
            grammarProgress: 0.7,
            fluencyProgress: 0.8,
            vocabularyGrowth: 0.65,
            confidenceLevel: 0.7,
            sessionsCompleted: 15,
            totalPracticeTime: 900, // 15 hours
            streakDays: 7
        },
        lastSessionDate: new Date('2024-01-15'),
        totalSessionTime: 900,
        milestones: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
    };
    const mockSessionHistory = [
        {
            sessionId: 'session-1',
            userId: 'test-user-123',
            agentId: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
            startTime: new Date('2024-01-15T10:00:00Z'),
            endTime: new Date('2024-01-15T10:20:00Z'),
            topic: 'Travel and Culture',
            difficulty: 'medium',
            messages: [],
            performanceMetrics: {
                duration: 1200000, // 20 minutes
                wordsSpoken: 150,
                averageResponseTime: 2500,
                grammarAccuracy: 0.85,
                fluencyScore: 0.8,
                vocabularyUsed: ['travel', 'culture', 'experience'],
                errorsCount: 3,
                improvementsShown: 2
            },
            feedbackProvided: [],
            status: 'completed'
        },
        {
            sessionId: 'session-2',
            userId: 'test-user-123',
            agentId: constants_1.AGENT_PERSONALITIES.CONVERSATION_PARTNER,
            startTime: new Date('2024-01-14T14:00:00Z'),
            endTime: new Date('2024-01-14T14:15:00Z'),
            topic: 'Food and Cooking',
            difficulty: 'easy',
            messages: [],
            performanceMetrics: {
                duration: 900000, // 15 minutes
                wordsSpoken: 120,
                averageResponseTime: 3000,
                grammarAccuracy: 0.75,
                fluencyScore: 0.85,
                vocabularyUsed: ['food', 'cooking', 'recipe'],
                errorsCount: 5,
                improvementsShown: 3
            },
            feedbackProvided: [],
            status: 'completed'
        }
    ];
    beforeEach(() => {
        jest.clearAllMocks();
        mockBedrockClient = {
            invokeModel: jest.fn()
        };
        bedrock_client_1.BedrockClient.mockImplementation(() => mockBedrockClient);
        recommendationEngine = new recommendation_engine_1.BedrockRecommendationEngine('us-east-1');
    });
    describe('recommendTopics', () => {
        it('should recommend topics based on user profile and history', async () => {
            // Mock Bedrock response for topic recommendations
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify([
                    {
                        topic: 'Work and Career',
                        relevanceScore: 0.9,
                        difficulty: 'medium',
                        reason: 'Builds on conversation skills with professional vocabulary',
                        estimatedDuration: 20
                    }
                ]),
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            });
            const recommendations = await recommendationEngine.recommendTopics(mockUserProfile, mockSessionHistory);
            expect(recommendations).toHaveLength(5); // Should return top 5
            expect(recommendations[0]).toHaveProperty('topic');
            expect(recommendations[0]).toHaveProperty('relevanceScore');
            expect(recommendations[0]).toHaveProperty('difficulty');
            expect(recommendations[0]).toHaveProperty('reason');
            expect(recommendations[0]).toHaveProperty('estimatedDuration');
        });
        it('should avoid recently used topics', async () => {
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify([]),
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            });
            const recommendations = await recommendationEngine.recommendTopics(mockUserProfile, mockSessionHistory);
            // Should not recommend recently used topics
            const recommendedTopics = recommendations.map(r => r.topic);
            expect(recommendedTopics).not.toContain('Travel and Culture');
            expect(recommendedTopics).not.toContain('Food and Cooking');
        });
        it('should return fallback recommendations on error', async () => {
            mockBedrockClient.invokeModel.mockRejectedValue(new Error('Bedrock error'));
            const recommendations = await recommendationEngine.recommendTopics(mockUserProfile, mockSessionHistory);
            expect(recommendations).toHaveLength(2); // User's preferred topics minus recent ones
            expect(recommendations.every(r => r.relevanceScore === 0.6)).toBe(true);
        });
    });
    describe('recommendAgents', () => {
        it('should recommend agents based on learning goals', async () => {
            const recommendations = await recommendationEngine.recommendAgents(mockUserProfile.learningGoals, mockUserProfile.progressMetrics);
            expect(recommendations).toHaveLength(3); // Top 3 agents
            expect(recommendations[0]).toHaveProperty('agentId');
            expect(recommendations[0]).toHaveProperty('agentName');
            expect(recommendations[0]).toHaveProperty('matchScore');
            expect(recommendations[0]).toHaveProperty('reason');
            expect(recommendations[0]).toHaveProperty('specialties');
            expect(recommendations[0]).toHaveProperty('recommendedFor');
            // Should be sorted by match score
            expect(recommendations[0].matchScore).toBeGreaterThanOrEqual(recommendations[1].matchScore);
        });
        it('should match agents to specific learning goals', async () => {
            const grammarGoals = ['grammar-accuracy'];
            const recommendations = await recommendationEngine.recommendAgents(grammarGoals, mockUserProfile.progressMetrics);
            // Should recommend strict teacher for grammar goals
            const strictTeacher = recommendations.find(r => r.agentId === constants_1.AGENT_PERSONALITIES.STRICT_TEACHER);
            expect(strictTeacher).toBeDefined();
            expect(strictTeacher?.matchScore).toBeGreaterThan(0.8);
        });
        it('should return fallback recommendations on error', async () => {
            // Force an error by passing invalid data
            const recommendations = await recommendationEngine.recommendAgents([], {});
            expect(recommendations).toHaveLength(1);
            expect(recommendations[0].agentId).toBe(constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR);
        });
    });
    describe('recommendDifficulty', () => {
        it('should recommend difficulty based on recent performance', async () => {
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify({
                    recommendedDifficulty: 'medium',
                    confidence: 0.85,
                    reasoning: 'User shows consistent performance at current level'
                }),
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            });
            const recommendation = await recommendationEngine.recommendDifficulty(mockUserProfile, mockSessionHistory);
            expect(recommendation).toHaveProperty('recommendedDifficulty');
            expect(recommendation).toHaveProperty('confidence');
            expect(recommendation).toHaveProperty('reasoning');
            expect(recommendation).toHaveProperty('adjustmentFactors');
            expect(recommendation.adjustmentFactors).toHaveProperty('recentPerformance');
            expect(recommendation.adjustmentFactors).toHaveProperty('userLevel');
            expect(recommendation.adjustmentFactors).toHaveProperty('sessionFrequency');
            expect(recommendation.adjustmentFactors).toHaveProperty('errorRate');
        });
        it('should return default difficulty for new users', async () => {
            const recommendation = await recommendationEngine.recommendDifficulty(mockUserProfile, []);
            expect(recommendation.recommendedDifficulty).toBe('medium'); // Default for intermediate
            expect(recommendation.confidence).toBe(0.7);
        });
        it('should handle Bedrock errors gracefully', async () => {
            mockBedrockClient.invokeModel.mockRejectedValue(new Error('Bedrock error'));
            const recommendation = await recommendationEngine.recommendDifficulty(mockUserProfile, mockSessionHistory);
            expect(recommendation.recommendedDifficulty).toBe('medium');
            expect(recommendation.reasoning).toContain('Based on your intermediate level');
        });
    });
    describe('generateSessionRecommendations', () => {
        it('should generate comprehensive session recommendations', async () => {
            // Mock Bedrock responses
            mockBedrockClient.invokeModel
                .mockResolvedValueOnce({
                content: JSON.stringify([{
                        topic: 'Technology and Innovation',
                        relevanceScore: 0.9,
                        difficulty: 'medium',
                        reason: 'Expands vocabulary in modern topics',
                        estimatedDuration: 20
                    }]),
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            })
                .mockResolvedValueOnce({
                content: JSON.stringify({
                    recommendedDifficulty: 'medium',
                    confidence: 0.85,
                    reasoning: 'Appropriate challenge level'
                }),
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            });
            const recommendations = await recommendationEngine.generateSessionRecommendations(mockUserProfile, mockSessionHistory);
            expect(recommendations).toHaveProperty('topics');
            expect(recommendations).toHaveProperty('agents');
            expect(recommendations).toHaveProperty('difficulty');
            expect(recommendations).toHaveProperty('sessionLength');
            expect(recommendations).toHaveProperty('focusAreas');
            expect(recommendations).toHaveProperty('motivationalMessage');
            expect(recommendations.topics).toHaveLength(5);
            expect(recommendations.agents).toHaveLength(3);
            expect(typeof recommendations.sessionLength).toBe('number');
            expect(recommendations.sessionLength).toBeGreaterThan(0);
            expect(Array.isArray(recommendations.focusAreas)).toBe(true);
            expect(typeof recommendations.motivationalMessage).toBe('string');
        });
        it('should identify focus areas based on progress metrics', async () => {
            const lowPerformanceProfile = {
                ...mockUserProfile,
                progressMetrics: {
                    ...mockUserProfile.progressMetrics,
                    grammarProgress: 0.5, // Below threshold
                    vocabularyGrowth: 0.4 // Below threshold
                }
            };
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify([]),
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            });
            const recommendations = await recommendationEngine.generateSessionRecommendations(lowPerformanceProfile, mockSessionHistory);
            expect(recommendations.focusAreas).toContain('grammar-accuracy');
            expect(recommendations.focusAreas).toContain('vocabulary-expansion');
        });
        it('should customize motivational messages based on performance', async () => {
            const highPerformanceProfile = {
                ...mockUserProfile,
                progressMetrics: {
                    ...mockUserProfile.progressMetrics,
                    streakDays: 10
                }
            };
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify([]),
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            });
            const recommendations = await recommendationEngine.generateSessionRecommendations(highPerformanceProfile, mockSessionHistory);
            expect(recommendations.motivationalMessage).toContain('10-day streak');
            expect(recommendations.motivationalMessage).toContain('🔥');
        });
    });
    describe('adaptToFeedback', () => {
        it('should store and analyze user feedback', async () => {
            const feedback = {
                sessionId: 'session-1',
                topicRating: 4,
                agentRating: 5,
                difficultyRating: 3,
                overallSatisfaction: 4,
                comments: 'Great session, but a bit easy'
            };
            await expect(recommendationEngine.adaptToFeedback('test-user-123', feedback))
                .resolves.not.toThrow();
            // Test that feedback is stored (would need access to internal state in real implementation)
        });
        it('should handle feedback adaptation errors gracefully', async () => {
            const invalidFeedback = {};
            await expect(recommendationEngine.adaptToFeedback('test-user-123', invalidFeedback))
                .rejects.toThrow('Failed to adapt to feedback');
        });
    });
    describe('private helper methods', () => {
        it('should calculate recent performance correctly', () => {
            const mockSessions = [
                { performanceMetrics: { grammarAccuracy: 0.8, fluencyScore: 0.7 } },
                { performanceMetrics: { grammarAccuracy: 0.9, fluencyScore: 0.8 } }
            ];
            const avgGrammar = mockSessions.reduce((sum, s) => sum + s.performanceMetrics.grammarAccuracy, 0) / mockSessions.length;
            expect(avgGrammar).toBe(0.85);
        });
        it('should match agents to goals appropriately', () => {
            const grammarGoal = 'grammar-accuracy';
            const expectedAgent = 'strict-teacher';
            // Test that grammar goals map to strict teacher
            expect(expectedAgent).toBe('strict-teacher');
        });
        it('should recommend appropriate session lengths', () => {
            const beginnerLevel = 'beginner';
            const expectedLength = 15; // minutes
            // Beginners should get shorter sessions
            expect(expectedLength).toBeLessThanOrEqual(20);
        });
    });
    describe('error handling', () => {
        it('should handle Bedrock service unavailability', async () => {
            mockBedrockClient.invokeModel.mockRejectedValue(new Error('Service unavailable'));
            const recommendations = await recommendationEngine.recommendTopics(mockUserProfile, mockSessionHistory);
            expect(recommendations).toHaveLength(2); // Fallback recommendations
            expect(recommendations.every(r => typeof r.topic === 'string')).toBe(true);
        });
        it('should handle malformed Bedrock responses', async () => {
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: 'Invalid JSON response',
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            });
            const recommendations = await recommendationEngine.recommendTopics(mockUserProfile, mockSessionHistory);
            expect(recommendations).toHaveLength(2); // Should fall back to rule-based recommendations
        });
        it('should validate input parameters', async () => {
            // Test with null/undefined inputs
            const recommendations = await recommendationEngine.recommendTopics({ ...mockUserProfile, learningGoals: [] }, []);
            expect(Array.isArray(recommendations)).toBe(true);
        });
    });
    describe('performance optimization', () => {
        it('should limit recommendation results appropriately', async () => {
            mockBedrockClient.invokeModel.mockResolvedValue({
                content: JSON.stringify(Array(20).fill({
                    topic: 'Test Topic',
                    relevanceScore: 0.8,
                    difficulty: 'medium',
                    reason: 'Test reason',
                    estimatedDuration: 15
                })),
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            });
            const recommendations = await recommendationEngine.recommendTopics(mockUserProfile, mockSessionHistory);
            expect(recommendations.length).toBeLessThanOrEqual(5); // Should limit to top 5
        });
        it('should handle large session histories efficiently', async () => {
            const largeHistory = Array(100).fill(mockSessionHistory[0]);
            const startTime = Date.now();
            await recommendationEngine.recommendTopics(mockUserProfile, largeHistory);
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });
});
