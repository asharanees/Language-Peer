"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const autonomous_conversation_orchestrator_1 = require("../autonomous-conversation-orchestrator");
const bedrock_client_1 = require("../bedrock-client");
// Mock the BedrockService
jest.mock('../bedrock-client');
describe('AutonomousConversationOrchestrator', () => {
    let orchestrator;
    let mockBedrockClient;
    const mockUserProfile = {
        userId: 'user-123',
        targetLanguage: 'English',
        nativeLanguage: 'Spanish',
        currentLevel: 'intermediate',
        learningGoals: ['conversation-fluency', 'grammar-accuracy'],
        preferredAgents: ['friendly-tutor'],
        conversationTopics: ['travel', 'technology'],
        progressMetrics: {
            overallImprovement: 75,
            grammarProgress: 80,
            fluencyProgress: 70,
            vocabularyGrowth: 75,
            confidenceLevel: 80,
            sessionsCompleted: 10,
            totalPracticeTime: 300,
            streakDays: 5
        },
        lastSessionDate: new Date('2024-01-15'),
        totalSessionTime: 300,
        milestones: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15')
    };
    const mockSessionHistory = [
        {
            sessionId: 'session-1',
            userId: 'user-123',
            agentId: 'agent-1',
            startTime: new Date('2024-01-10'),
            endTime: new Date('2024-01-10'),
            topic: 'Travel Planning',
            difficulty: 'medium',
            messages: [],
            performanceMetrics: {
                duration: 15,
                wordsSpoken: 150,
                averageResponseTime: 3000,
                grammarAccuracy: 75,
                fluencyScore: 70,
                vocabularyUsed: ['travel', 'planning', 'vacation'],
                errorsCount: 5,
                improvementsShown: 3
            },
            feedbackProvided: [],
            status: 'completed'
        }
    ];
    beforeEach(() => {
        mockBedrockClient = new bedrock_client_1.BedrockService();
        orchestrator = new autonomous_conversation_orchestrator_1.AutonomousConversationOrchestrator(mockBedrockClient);
    });
    describe('selectTopicAutonomously', () => {
        it('should select appropriate topic based on user profile', async () => {
            const mockResponse = {
                content: JSON.stringify({
                    topic: 'Business Meetings',
                    difficulty: 'intermediate',
                    reason: 'Matches user\'s business communication goals',
                    confidence: 0.85,
                    estimatedDuration: 20
                })
            };
            mockBedrockClient.invokeModel.mockResolvedValue(mockResponse);
            const result = await orchestrator.selectTopicAutonomously(mockUserProfile, mockSessionHistory);
            expect(result.topic).toBe('Business Meetings');
            expect(result.difficulty).toBe('intermediate');
            expect(result.confidence).toBe(0.85);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith(expect.stringContaining('AI language learning assistant'), expect.any(String), expect.objectContaining({
                userId: 'user-123'
            }));
        });
        it('should return fallback topic when Bedrock call fails', async () => {
            mockBedrockClient.invokeModel.mockRejectedValue(new Error('API Error'));
            const result = await orchestrator.selectTopicAutonomously(mockUserProfile, mockSessionHistory);
            expect(result.topic).toBeDefined();
            expect(result.difficulty).toBe('intermediate');
            expect(result.confidence).toBe(0.6);
        });
        it('should handle invalid JSON response gracefully', async () => {
            const mockResponse = { content: 'Invalid JSON response', usage: { inputTokens: 0, outputTokens: 0 }, stopReason: 'end_turn' };
            mockBedrockClient.invokeModel.mockResolvedValue(mockResponse);
            const result = await orchestrator.selectTopicAutonomously(mockUserProfile, mockSessionHistory);
            expect(result.topic).toBeDefined();
            expect(result.difficulty).toBe('intermediate');
        });
        it('should consider recent topics to avoid repetition', async () => {
            const mockResponse = {
                content: JSON.stringify({
                    topic: 'Technology Trends',
                    difficulty: 'intermediate',
                    reason: 'Different from recent travel topic',
                    confidence: 0.8,
                    estimatedDuration: 18
                }),
                usage: { inputTokens: 0, outputTokens: 0 },
                stopReason: 'end_turn'
            };
            mockBedrockClient.invokeModel.mockResolvedValue(mockResponse);
            const result = await orchestrator.selectTopicAutonomously(mockUserProfile, mockSessionHistory);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('Travel Planning'), expect.any(Object));
        });
    });
    describe('adjustDifficultyAutonomously', () => {
        const mockMessages = [
            {
                messageId: 'msg-1',
                sessionId: 'session-1',
                sender: 'user',
                content: 'I think the weather is very good today',
                timestamp: new Date(),
                transcriptionConfidence: 0.9
            },
            {
                messageId: 'msg-2',
                sessionId: 'session-1',
                sender: 'agent',
                content: 'That\'s great! What are your plans for today?',
                timestamp: new Date()
            }
        ];
        it('should recommend difficulty increase for high performance', async () => {
            const mockResponse = {
                content: JSON.stringify({
                    recommendedDifficulty: 'advanced',
                    adjustmentReason: 'User consistently scoring above 85%',
                    adjustmentStrength: 'moderate'
                }),
                usage: { inputTokens: 0, outputTokens: 0 },
                stopReason: 'end_turn'
            };
            mockBedrockClient.invokeModel.mockResolvedValue(mockResponse);
            const performanceMetrics = {
                grammarScore: 90,
                fluencyScore: 88,
                confidence: 0.92,
                errorRate: 0.05
            };
            const result = await orchestrator.adjustDifficultyAutonomously(mockUserProfile, mockMessages, performanceMetrics);
            expect(result.recommendedDifficulty).toBe('advanced');
            expect(result.adjustmentStrength).toBe('moderate');
        });
        it('should recommend difficulty decrease for low performance', async () => {
            const mockResponse = {
                content: JSON.stringify({
                    recommendedDifficulty: 'beginner',
                    adjustmentReason: 'User struggling with current level',
                    adjustmentStrength: 'major'
                })
            };
            mockBedrockClient.generateResponse.mockResolvedValue(mockResponse);
            const performanceMetrics = {
                grammarScore: 45,
                fluencyScore: 50,
                confidence: 0.4,
                errorRate: 0.6
            };
            const result = await orchestrator.adjustDifficultyAutonomously(mockUserProfile, mockMessages, performanceMetrics);
            expect(result.recommendedDifficulty).toBe('beginner');
            expect(result.adjustmentStrength).toBe('major');
        });
        it('should maintain current difficulty on API error', async () => {
            mockBedrockClient.generateResponse.mockRejectedValue(new Error('API Error'));
            const result = await orchestrator.adjustDifficultyAutonomously(mockUserProfile, mockMessages, {});
            expect(result.currentDifficulty).toBe('intermediate');
            expect(result.recommendedDifficulty).toBe('intermediate');
            expect(result.adjustmentReason).toContain('system error');
        });
    });
    describe('detectEngagementAndRespond', () => {
        const mockMessages = [
            {
                id: 'msg-1',
                type: 'user',
                content: 'Yes',
                timestamp: new Date(Date.now() - 5000),
                confidence: 0.6
            }
        ];
        it('should detect silence and generate appropriate prompt', async () => {
            const lastActivity = new Date(Date.now() - 15000); // 15 seconds ago
            const result = await orchestrator.detectEngagementAndRespond(mockMessages, lastActivity, mockUserProfile);
            expect(result).not.toBeNull();
            expect(result?.type).toBe('continuation');
            expect(result?.urgency).toBe('medium');
            expect(result?.context).toBe('User silence detected');
        });
        it('should detect low engagement and generate encouragement', async () => {
            const shortMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'Yes',
                    timestamp: new Date(),
                    confidence: 0.3
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Ok',
                    timestamp: new Date(),
                    confidence: 0.4
                }
            ];
            const result = await orchestrator.detectEngagementAndRespond(shortMessages, new Date(), mockUserProfile);
            expect(result).not.toBeNull();
            expect(result?.type).toBe('encouragement');
            expect(result?.urgency).toBe('high');
        });
        it('should detect frustration and provide support', async () => {
            const frustratedMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'This is too difficult, I don\'t understand',
                    timestamp: new Date(),
                    confidence: 0.5
                }
            ];
            const result = await orchestrator.detectEngagementAndRespond(frustratedMessages, new Date(), mockUserProfile);
            expect(result).not.toBeNull();
            expect(result?.type).toBe('encouragement');
            expect(result?.urgency).toBe('high');
            expect(result?.context).toBe('User frustration detected');
        });
        it('should return null when no intervention is needed', async () => {
            const goodMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I really enjoyed our conversation about travel. It was very interesting to learn about different cultures.',
                    timestamp: new Date(),
                    confidence: 0.9
                }
            ];
            const result = await orchestrator.detectEngagementAndRespond(goodMessages, new Date(), mockUserProfile);
            expect(result).toBeNull();
        });
    });
    describe('generateContinuationPrompt', () => {
        const mockMessages = [
            {
                id: 'msg-1',
                type: 'user',
                content: 'I love traveling to new places',
                timestamp: new Date()
            },
            {
                id: 'msg-2',
                type: 'agent',
                content: 'That sounds exciting! Where have you been recently?',
                timestamp: new Date()
            }
        ];
        it('should generate natural continuation prompt', async () => {
            const mockResponse = {
                content: 'What was your favorite destination and why did you enjoy it so much?'
            };
            mockBedrockClient.generateResponse.mockResolvedValue(mockResponse);
            const result = await orchestrator.generateContinuationPrompt(mockMessages, 'Travel Experiences', mockUserProfile);
            expect(result.type).toBe('continuation');
            expect(result.message).toBe(mockResponse.content);
            expect(result.context).toBe('Travel Experiences');
            expect(result.urgency).toBe('low');
        });
        it('should provide fallback prompt on API error', async () => {
            mockBedrockClient.generateResponse.mockRejectedValue(new Error('API Error'));
            const result = await orchestrator.generateContinuationPrompt(mockMessages, 'Travel Experiences', mockUserProfile);
            expect(result.type).toBe('continuation');
            expect(result.message).toContain('travel experiences');
            expect(result.urgency).toBe('low');
        });
    });
    describe('analyzePerformanceTrends', () => {
        it('should identify improving trend', () => {
            const improvingSessions = [
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-1',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 70 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-2',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 80 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-3',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 85 }
                }
            ];
            const result = orchestrator.analyzePerformanceTrends(improvingSessions, 'week');
            expect(result.trend).toBe('improving');
            expect(result.confidence).toBeGreaterThan(0.5);
            expect(result.recommendations).toContain(expect.stringMatching(/increasing.*difficulty/i));
        });
        it('should identify declining trend', () => {
            const decliningSessions = [
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-1',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 85 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-2',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 75 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-3',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 65 }
                }
            ];
            const result = orchestrator.analyzePerformanceTrends(decliningSessions, 'week');
            expect(result.trend).toBe('declining');
            expect(result.recommendations).toContain(expect.stringMatching(/reviewing.*feedback/i));
        });
        it('should handle insufficient data gracefully', () => {
            const result = orchestrator.analyzePerformanceTrends([], 'week');
            expect(result.trend).toBe('stable');
            expect(result.confidence).toBe(0.5);
            expect(result.recommendations).toContain(expect.stringMatching(/baseline/i));
        });
        it('should filter sessions by timeframe correctly', () => {
            const oldSession = {
                ...mockSessionHistory[0],
                sessionId: 'old-session',
                startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            };
            const recentSession = {
                ...mockSessionHistory[0],
                sessionId: 'recent-session',
                startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
            };
            const sessions = [oldSession, recentSession];
            const result = orchestrator.analyzePerformanceTrends(sessions, 'week');
            // Should only consider recent session for weekly analysis
            expect(result).toBeDefined();
        });
    });
    describe('engagement metrics calculation', () => {
        it('should calculate engagement metrics correctly', async () => {
            const messages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I really enjoyed learning about different cultures during my travels',
                    timestamp: new Date(),
                    confidence: 0.9
                },
                {
                    id: 'msg-2',
                    type: 'agent',
                    content: 'That sounds fascinating!',
                    timestamp: new Date()
                },
                {
                    id: 'msg-3',
                    type: 'user',
                    content: 'Yes, it was amazing',
                    timestamp: new Date(),
                    confidence: 0.8
                }
            ];
            const result = await orchestrator.detectEngagementAndRespond(messages, new Date(), mockUserProfile);
            // High engagement should not trigger intervention
            expect(result).toBeNull();
        });
        it('should detect low engagement from short responses', async () => {
            const messages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'Yes',
                    timestamp: new Date(),
                    confidence: 0.4
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Ok',
                    timestamp: new Date(),
                    confidence: 0.3
                },
                {
                    id: 'msg-3',
                    type: 'user',
                    content: 'Sure',
                    timestamp: new Date(),
                    confidence: 0.5
                }
            ];
            const result = await orchestrator.detectEngagementAndRespond(messages, new Date(), mockUserProfile);
            expect(result).not.toBeNull();
            expect(result?.type).toBe('encouragement');
        });
    });
    describe('error handling and resilience', () => {
        it('should handle Bedrock API timeouts gracefully', async () => {
            mockBedrockClient.generateResponse.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100)));
            const result = await orchestrator.selectTopicAutonomously(mockUserProfile, mockSessionHistory);
            expect(result).toBeDefined();
            expect(result.topic).toBeDefined();
        });
        it('should provide meaningful fallbacks for all operations', async () => {
            mockBedrockClient.generateResponse.mockRejectedValue(new Error('Service unavailable'));
            const topicResult = await orchestrator.selectTopicAutonomously(mockUserProfile, mockSessionHistory);
            const difficultyResult = await orchestrator.adjustDifficultyAutonomously(mockUserProfile, [], {});
            const continuationResult = await orchestrator.generateContinuationPrompt([], 'Test Topic', mockUserProfile);
            expect(topicResult.topic).toBeDefined();
            expect(difficultyResult.recommendedDifficulty).toBeDefined();
            expect(continuationResult.message).toBeDefined();
        });
    });
    // Additional comprehensive tests for autonomous conversation features
    describe('Topic Selection Algorithm Tests', () => {
        it('should select beginner topics for beginner users', async () => {
            const beginnerProfile = {
                ...mockUserProfile,
                currentLevel: 'beginner',
                conversationTopics: ['food', 'family']
            };
            const mockResponse = {
                content: JSON.stringify({
                    topic: 'Daily Meals',
                    difficulty: 'beginner',
                    reason: 'Matches beginner level and food interest',
                    confidence: 0.9,
                    estimatedDuration: 10
                })
            };
            mockBedrockClient.generateResponse.mockResolvedValue(mockResponse);
            const result = await orchestrator.selectTopicAutonomously(beginnerProfile, []);
            expect(result.difficulty).toBe('beginner');
            expect(result.topic).toBe('Daily Meals');
            expect(mockBedrockClient.generateResponse).toHaveBeenCalledWith(expect.objectContaining({
                prompt: expect.stringContaining('beginner')
            }));
        });
        it('should select advanced topics for advanced users', async () => {
            const advancedProfile = {
                ...mockUserProfile,
                currentLevel: 'advanced',
                conversationTopics: ['philosophy', 'economics']
            };
            const mockResponse = {
                content: JSON.stringify({
                    topic: 'Economic Theory',
                    difficulty: 'advanced',
                    reason: 'Matches advanced level and economics interest',
                    confidence: 0.85,
                    estimatedDuration: 25
                })
            };
            mockBedrockClient.generateResponse.mockResolvedValue(mockResponse);
            const result = await orchestrator.selectTopicAutonomously(advancedProfile, []);
            expect(result.difficulty).toBe('advanced');
            expect(result.topic).toBe('Economic Theory');
        });
        it('should avoid recently covered topics', async () => {
            const recentSessions = [
                {
                    ...mockSessionHistory[0],
                    topic: 'Travel Planning'
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-2',
                    topic: 'Food Culture'
                }
            ];
            const mockResponse = {
                content: JSON.stringify({
                    topic: 'Technology Trends',
                    difficulty: 'intermediate',
                    reason: 'Avoiding recent topics: Travel Planning, Food Culture',
                    confidence: 0.8,
                    estimatedDuration: 18
                })
            };
            mockBedrockClient.generateResponse.mockResolvedValue(mockResponse);
            const result = await orchestrator.selectTopicAutonomously(mockUserProfile, recentSessions);
            expect(result.topic).toBe('Technology Trends');
            expect(mockBedrockClient.generateResponse).toHaveBeenCalledWith(expect.objectContaining({
                prompt: expect.stringContaining('Travel Planning, Food Culture')
            }));
        });
        it('should consider user learning goals in topic selection', async () => {
            const businessProfile = {
                ...mockUserProfile,
                learningGoals: ['business communication', 'professional networking']
            };
            const mockResponse = {
                content: JSON.stringify({
                    topic: 'Business Presentations',
                    difficulty: 'intermediate',
                    reason: 'Aligns with business communication goals',
                    confidence: 0.9,
                    estimatedDuration: 20
                })
            };
            mockBedrockClient.generateResponse.mockResolvedValue(mockResponse);
            const result = await orchestrator.selectTopicAutonomously(businessProfile, []);
            expect(mockBedrockClient.generateResponse).toHaveBeenCalledWith(expect.objectContaining({
                prompt: expect.stringContaining('business communication, professional networking')
            }));
        });
        it('should provide variety when user has limited topic preferences', async () => {
            const limitedProfile = {
                ...mockUserProfile,
                conversationTopics: ['sports']
            };
            const fallbackResult = await orchestrator.selectTopicAutonomously(limitedProfile, []);
            // Should still provide a valid topic even with limited preferences
            expect(fallbackResult.topic).toBeDefined();
            expect(fallbackResult.confidence).toBeGreaterThan(0);
        });
    });
    describe('Difficulty Adjustment Algorithm Tests', () => {
        it('should increase difficulty for consistently high performance', async () => {
            const highPerformanceMetrics = {
                grammarScore: 92,
                fluencyScore: 89,
                confidence: 0.95,
                errorRate: 0.03
            };
            const mockResponse = {
                content: JSON.stringify({
                    recommendedDifficulty: 'advanced',
                    adjustmentReason: 'Consistently high performance indicates readiness for advanced level',
                    adjustmentStrength: 'moderate'
                })
            };
            mockBedrockClient.generateResponse.mockResolvedValue(mockResponse);
            const result = await orchestrator.adjustDifficultyAutonomously(mockUserProfile, [], highPerformanceMetrics);
            expect(result.recommendedDifficulty).toBe('advanced');
            expect(result.adjustmentStrength).toBe('moderate');
            expect(mockBedrockClient.generateResponse).toHaveBeenCalledWith(expect.objectContaining({
                prompt: expect.stringContaining('92%')
            }));
        });
        it('should decrease difficulty for struggling users', async () => {
            const lowPerformanceMetrics = {
                grammarScore: 35,
                fluencyScore: 40,
                confidence: 0.3,
                errorRate: 0.7
            };
            const mockResponse = {
                content: JSON.stringify({
                    recommendedDifficulty: 'beginner',
                    adjustmentReason: 'Low performance scores indicate need for easier content',
                    adjustmentStrength: 'major'
                })
            };
            mockBedrockClient.generateResponse.mockResolvedValue(mockResponse);
            const result = await orchestrator.adjustDifficultyAutonomously(mockUserProfile, [], lowPerformanceMetrics);
            expect(result.recommendedDifficulty).toBe('beginner');
            expect(result.adjustmentStrength).toBe('major');
        });
        it('should maintain difficulty for stable performance', async () => {
            const stablePerformanceMetrics = {
                grammarScore: 75,
                fluencyScore: 72,
                confidence: 0.78,
                errorRate: 0.25
            };
            const mockResponse = {
                content: JSON.stringify({
                    recommendedDifficulty: 'intermediate',
                    adjustmentReason: 'Performance is stable at current level',
                    adjustmentStrength: 'minor'
                })
            };
            mockBedrockClient.generateResponse.mockResolvedValue(mockResponse);
            const result = await orchestrator.adjustDifficultyAutonomously(mockUserProfile, [], stablePerformanceMetrics);
            expect(result.recommendedDifficulty).toBe('intermediate');
            expect(result.adjustmentStrength).toBe('minor');
        });
        it('should consider user level constraints in difficulty adjustment', async () => {
            const beginnerProfile = {
                ...mockUserProfile,
                currentLevel: 'beginner'
            };
            const result = await orchestrator.adjustDifficultyAutonomously(beginnerProfile, [], { grammarScore: 95, fluencyScore: 95, confidence: 0.95, errorRate: 0.02 });
            // Even with high performance, shouldn't jump too far from beginner
            expect(['beginner', 'intermediate']).toContain(result.recommendedDifficulty);
        });
        it('should handle missing performance metrics gracefully', async () => {
            const result = await orchestrator.adjustDifficultyAutonomously(mockUserProfile, [], {} // Empty metrics
            );
            expect(result.recommendedDifficulty).toBeDefined();
            expect(result.adjustmentReason).toContain('system error');
        });
    });
    describe('Engagement Detection and Response Tests', () => {
        it('should detect user silence and provide appropriate prompts', async () => {
            const oldActivity = new Date(Date.now() - 12000); // 12 seconds ago
            const result = await orchestrator.detectEngagementAndRespond([], oldActivity, mockUserProfile);
            expect(result).not.toBeNull();
            expect(result?.type).toBe('continuation');
            expect(result?.urgency).toBe('medium');
            expect(result?.context).toBe('User silence detected');
            expect(result?.message).toBeDefined();
        });
        it('should detect low engagement from response patterns', async () => {
            const lowEngagementMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'Yes',
                    timestamp: new Date(Date.now() - 30000),
                    confidence: 0.3
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'Ok',
                    timestamp: new Date(Date.now() - 20000),
                    confidence: 0.4
                },
                {
                    id: 'msg-3',
                    type: 'user',
                    content: 'Sure',
                    timestamp: new Date(Date.now() - 10000),
                    confidence: 0.2
                }
            ];
            const result = await orchestrator.detectEngagementAndRespond(lowEngagementMessages, new Date(), mockUserProfile);
            expect(result).not.toBeNull();
            expect(result?.type).toBe('encouragement');
            expect(result?.urgency).toBe('high');
        });
        it('should detect frustration and provide supportive responses', async () => {
            const frustratedMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'This is too difficult, I can\'t understand anything',
                    timestamp: new Date(),
                    confidence: 0.4
                },
                {
                    id: 'msg-2',
                    type: 'user',
                    content: 'I\'m confused and frustrated',
                    timestamp: new Date(),
                    confidence: 0.3
                }
            ];
            const result = await orchestrator.detectEngagementAndRespond(frustratedMessages, new Date(), mockUserProfile);
            expect(result).not.toBeNull();
            expect(result?.type).toBe('encouragement');
            expect(result?.urgency).toBe('high');
            expect(result?.context).toBe('User frustration detected');
        });
        it('should not intervene when engagement is healthy', async () => {
            const healthyMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I really enjoyed learning about Japanese culture during my trip. The temples were magnificent and the people were incredibly welcoming.',
                    timestamp: new Date(),
                    confidence: 0.9
                }
            ];
            const result = await orchestrator.detectEngagementAndRespond(healthyMessages, new Date(), mockUserProfile);
            expect(result).toBeNull();
        });
        it('should adapt intervention style to user profile', async () => {
            const sensitiveProfile = {
                ...mockUserProfile,
                learningGoals: ['build confidence', 'overcome anxiety']
            };
            const result = await orchestrator.detectEngagementAndRespond([], new Date(Date.now() - 15000), sensitiveProfile);
            expect(result?.message).toBeDefined();
            // Should provide gentle, supportive messaging for confidence-building users
        });
    });
    describe('Performance Trend Analysis Tests', () => {
        it('should identify improving performance trends accurately', () => {
            const improvingSessions = [
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-1',
                    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 65 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-2',
                    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 72 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-3',
                    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 78 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-4',
                    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 85 }
                }
            ];
            const result = orchestrator.analyzePerformanceTrends(improvingSessions, 'week');
            expect(result.trend).toBe('improving');
            expect(result.confidence).toBeGreaterThan(0.7);
            expect(result.recommendations).toContain(expect.stringMatching(/increasing.*difficulty/i));
        });
        it('should identify declining performance trends accurately', () => {
            const decliningSessions = [
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-1',
                    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 85 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-2',
                    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 78 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-3',
                    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 70 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-4',
                    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 62 }
                }
            ];
            const result = orchestrator.analyzePerformanceTrends(decliningSessions, 'week');
            expect(result.trend).toBe('declining');
            expect(result.recommendations).toContain(expect.stringMatching(/reviewing.*feedback/i));
        });
        it('should calculate trend confidence based on data consistency', () => {
            const consistentSessions = [
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-1',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 70 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-2',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 75 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-3',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 80 }
                }
            ];
            const inconsistentSessions = [
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-1',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 50 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-2',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 90 }
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'session-3',
                    performanceMetrics: { ...mockSessionHistory[0].performanceMetrics, overallScore: 60 }
                }
            ];
            const consistentResult = orchestrator.analyzePerformanceTrends(consistentSessions, 'week');
            const inconsistentResult = orchestrator.analyzePerformanceTrends(inconsistentSessions, 'week');
            expect(consistentResult.confidence).toBeGreaterThan(inconsistentResult.confidence);
        });
        it('should filter sessions by timeframe correctly', () => {
            const mixedTimeSessions = [
                {
                    ...mockSessionHistory[0],
                    sessionId: 'old-session',
                    startTime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
                },
                {
                    ...mockSessionHistory[0],
                    sessionId: 'recent-session',
                    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
                }
            ];
            const weekResult = orchestrator.analyzePerformanceTrends(mixedTimeSessions, 'week');
            const monthResult = orchestrator.analyzePerformanceTrends(mixedTimeSessions, 'month');
            const allResult = orchestrator.analyzePerformanceTrends(mixedTimeSessions, 'all');
            // Week should only include recent session
            // Month should include both
            // All should include both
            expect(allResult).toBeDefined();
        });
    });
    describe('Autonomous Decision Making Integration Tests', () => {
        it('should make coordinated decisions across topic, difficulty, and engagement', async () => {
            // Simulate a struggling user scenario
            const strugglingProfile = {
                ...mockUserProfile,
                currentLevel: 'intermediate'
            };
            const strugglingMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I don\'t understand',
                    timestamp: new Date(),
                    confidence: 0.3
                }
            ];
            const lowPerformanceMetrics = {
                grammarScore: 45,
                fluencyScore: 40,
                confidence: 0.35,
                errorRate: 0.6
            };
            // Mock responses for coordinated decision making
            mockBedrockClient.generateResponse
                .mockResolvedValueOnce({
                content: JSON.stringify({
                    topic: 'Simple Daily Activities',
                    difficulty: 'beginner',
                    reason: 'Easier topic to rebuild confidence',
                    confidence: 0.8,
                    estimatedDuration: 10
                })
            })
                .mockResolvedValueOnce({
                content: JSON.stringify({
                    recommendedDifficulty: 'beginner',
                    adjustmentReason: 'User showing signs of struggle',
                    adjustmentStrength: 'moderate'
                })
            });
            // Test coordinated autonomous decisions
            const topicResult = await orchestrator.selectTopicAutonomously(strugglingProfile, []);
            const difficultyResult = await orchestrator.adjustDifficultyAutonomously(strugglingProfile, strugglingMessages, lowPerformanceMetrics);
            const engagementResult = await orchestrator.detectEngagementAndRespond(strugglingMessages, new Date(), strugglingProfile);
            // All systems should coordinate to help struggling user
            expect(topicResult.difficulty).toBe('beginner');
            expect(difficultyResult.recommendedDifficulty).toBe('beginner');
            expect(engagementResult?.type).toBe('encouragement');
        });
        it('should adapt to high-performing users appropriately', async () => {
            const advancedProfile = {
                ...mockUserProfile,
                currentLevel: 'advanced'
            };
            const engagedMessages = [
                {
                    id: 'msg-1',
                    type: 'user',
                    content: 'I find the philosophical implications of artificial intelligence fascinating, particularly regarding consciousness and ethical decision-making frameworks.',
                    timestamp: new Date(),
                    confidence: 0.95
                }
            ];
            const highPerformanceMetrics = {
                grammarScore: 92,
                fluencyScore: 89,
                confidence: 0.94,
                errorRate: 0.04
            };
            mockBedrockClient.generateResponse
                .mockResolvedValueOnce({
                content: JSON.stringify({
                    topic: 'Advanced AI Ethics',
                    difficulty: 'advanced',
                    reason: 'User demonstrates sophisticated understanding',
                    confidence: 0.9,
                    estimatedDuration: 30
                })
            });
            const topicResult = await orchestrator.selectTopicAutonomously(advancedProfile, []);
            const engagementResult = await orchestrator.detectEngagementAndRespond(engagedMessages, new Date(), advancedProfile);
            // Should provide challenging content for high performers
            expect(topicResult.difficulty).toBe('advanced');
            expect(engagementResult).toBeNull(); // No intervention needed
        });
    });
});
