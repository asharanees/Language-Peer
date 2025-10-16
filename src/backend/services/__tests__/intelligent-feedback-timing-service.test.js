"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const intelligent_feedback_timing_service_1 = require("../intelligent-feedback-timing-service");
const constants_1 = require("../../../shared/constants");
// Mock dependencies
jest.mock('../bedrock-client');
jest.mock('../engagement-detection-service');
describe('IntelligentFeedbackTimingService', () => {
    let service;
    let mockBedrockClient;
    let mockEngagementService;
    const mockUserProfile = {
        userId: 'user-123',
        targetLanguage: 'English',
        nativeLanguage: 'Spanish',
        currentLevel: 'intermediate',
        learningGoals: ['conversation-fluency', 'grammar-accuracy'],
        preferredAgents: ['friendly-tutor'],
        conversationTopics: ['travel', 'food'],
        progressMetrics: {
            overallImprovement: 0.7,
            grammarProgress: 0.6,
            fluencyProgress: 0.8,
            vocabularyGrowth: 0.5,
            confidenceLevel: 0.7,
            sessionsCompleted: 15,
            totalPracticeTime: 1200,
            streakDays: 5
        },
        lastSessionDate: new Date(),
        totalSessionTime: 3600,
        milestones: [],
        createdAt: new Date(),
        updatedAt: new Date()
    };
    const mockSessionMetrics = {
        duration: 600000, // 10 minutes
        wordsSpoken: 150,
        averageResponseTime: 3000,
        grammarAccuracy: 75,
        fluencyScore: 80,
        vocabularyUsed: ['hello', 'world', 'travel'],
        errorsCount: 5,
        improvementsShown: 3
    };
    const mockLanguageAnalysis = {
        grammarScore: 75,
        fluencyScore: 80,
        vocabularyLevel: 65,
        detectedErrors: [
            {
                type: 'grammar',
                description: 'Subject-verb agreement error',
                suggestion: 'Use "is" instead of "are"',
                position: { start: 10, end: 15 }
            }
        ],
        suggestions: ['Try using more varied vocabulary'],
        sentiment: 0.6
    };
    const mockConversationHistory = [
        {
            messageId: 'msg-1',
            sessionId: 'session-1',
            sender: 'agent',
            content: 'Hello! How are you today?',
            timestamp: new Date(Date.now() - 30000),
            transcriptionConfidence: 0.95
        },
        {
            messageId: 'msg-2',
            sessionId: 'session-1',
            sender: 'user',
            content: 'I are good, thank you!',
            timestamp: new Date(Date.now() - 20000),
            transcriptionConfidence: 0.85,
            languageAnalysis: mockLanguageAnalysis
        }
    ];
    beforeEach(() => {
        mockBedrockClient = {
            invokeModel: jest.fn()
        };
        mockEngagementService = {
            analyzeEngagement: jest.fn()
        };
        service = new intelligent_feedback_timing_service_1.IntelligentFeedbackTimingService(mockBedrockClient, mockEngagementService);
    });
    describe('determineFeedbackTiming', () => {
        it('should determine appropriate feedback timing for grammar errors', async () => {
            const mockEngagementAnalysis = {
                overallEngagement: 70,
                riskLevel: 'low',
                recommendedActions: [],
                detectedPatterns: [],
                interventionUrgency: 'none'
            };
            mockEngagementService.analyzeEngagement.mockReturnValue(mockEngagementAnalysis);
            const currentMessage = mockConversationHistory[1];
            const result = await service.determineFeedbackTiming(mockConversationHistory, currentMessage, mockLanguageAnalysis, mockUserProfile, mockSessionMetrics);
            expect(result.shouldProvideFeedback).toBe(true);
            expect(result.feedbackType).toBe(constants_1.FEEDBACK_TYPES.CORRECTION);
            expect(result.urgency).toBeOneOf(['low', 'medium', 'high']);
            expect(result.delayMs).toBeGreaterThan(0);
            expect(result.reason).toBeTruthy();
            expect(result.confidence).toBeGreaterThan(0);
        });
        it('should not provide feedback when user is too frustrated', async () => {
            const mockEngagementAnalysis = {
                overallEngagement: 20,
                riskLevel: 'high',
                recommendedActions: [],
                detectedPatterns: ['frustration_detected'],
                interventionUrgency: 'high'
            };
            mockEngagementService.analyzeEngagement.mockReturnValue(mockEngagementAnalysis);
            const currentMessage = mockConversationHistory[1];
            const result = await service.determineFeedbackTiming(mockConversationHistory, currentMessage, mockLanguageAnalysis, mockUserProfile, mockSessionMetrics);
            expect(result.shouldProvideFeedback).toBe(false);
            expect(result.reason).toContain('frustration');
        });
        it('should provide encouragement when user needs motivation', async () => {
            const mockEngagementAnalysis = {
                overallEngagement: 30,
                riskLevel: 'medium',
                recommendedActions: [],
                detectedPatterns: ['declining_performance'],
                interventionUrgency: 'medium'
            };
            mockEngagementService.analyzeEngagement.mockReturnValue(mockEngagementAnalysis);
            const noErrorAnalysis = {
                ...mockLanguageAnalysis,
                detectedErrors: []
            };
            const currentMessage = mockConversationHistory[1];
            const result = await service.determineFeedbackTiming(mockConversationHistory, currentMessage, noErrorAnalysis, mockUserProfile, mockSessionMetrics);
            if (result.shouldProvideFeedback) {
                expect(result.feedbackType).toBe(constants_1.FEEDBACK_TYPES.ENCOURAGEMENT);
            }
        });
    });
    describe('prioritizeErrors', () => {
        it('should prioritize errors based on severity and learning impact', () => {
            const result = service.prioritizeErrors(mockLanguageAnalysis, mockUserProfile);
            expect(result).toHaveLength(1);
            expect(result[0].errorType).toBe('grammar');
            expect(result[0].severity).toBeOneOf(['low', 'medium', 'high', 'critical']);
            expect(result[0].priority).toBeGreaterThan(0);
            expect(result[0].impact).toBeGreaterThanOrEqual(0);
            expect(result[0].impact).toBeLessThanOrEqual(1);
        });
        it('should return empty array when no errors detected', () => {
            const noErrorAnalysis = {
                ...mockLanguageAnalysis,
                detectedErrors: []
            };
            const result = service.prioritizeErrors(noErrorAnalysis, mockUserProfile);
            expect(result).toHaveLength(0);
        });
        it('should prioritize critical errors higher', () => {
            const multipleErrorAnalysis = {
                ...mockLanguageAnalysis,
                detectedErrors: [
                    {
                        type: 'pronunciation',
                        description: 'Minor pronunciation issue',
                        suggestion: 'Try pronouncing more clearly',
                        position: { start: 0, end: 5 }
                    },
                    {
                        type: 'grammar',
                        description: 'Critical grammar error',
                        suggestion: 'Fix subject-verb agreement',
                        position: { start: 10, end: 15 }
                    }
                ]
            };
            const advancedUser = {
                ...mockUserProfile,
                currentLevel: 'advanced'
            };
            const result = service.prioritizeErrors(multipleErrorAnalysis, advancedUser);
            expect(result).toHaveLength(2);
            // Grammar errors should be prioritized higher for advanced users
            expect(result[0].errorType).toBe('grammar');
        });
    });
    describe('assessMotivationalContext', () => {
        it('should assess user motivational context correctly', () => {
            const mockEngagementAnalysis = {
                overallEngagement: 50,
                riskLevel: 'medium'
            };
            const result = service.assessMotivationalContext(mockConversationHistory, mockSessionMetrics, mockEngagementAnalysis);
            expect(result.userFrustrationLevel).toBeGreaterThanOrEqual(0);
            expect(result.userFrustrationLevel).toBeLessThanOrEqual(1);
            expect(result.recentPerformance).toBeGreaterThanOrEqual(0);
            expect(result.recentPerformance).toBeLessThanOrEqual(1);
            expect(result.sessionDuration).toBeGreaterThan(0);
            expect(result.errorCount).toBe(mockSessionMetrics.errorsCount);
            expect(result.successCount).toBe(mockSessionMetrics.improvementsShown);
            expect(typeof result.needsEncouragement).toBe('boolean');
            expect(result.motivationType).toBeOneOf(['progress', 'effort', 'improvement', 'milestone']);
        });
        it('should detect high frustration from poor performance', () => {
            const poorSessionMetrics = {
                ...mockSessionMetrics,
                grammarAccuracy: 30,
                fluencyScore: 25,
                errorsCount: 15,
                improvementsShown: 1
            };
            const mockEngagementAnalysis = {
                overallEngagement: 20,
                riskLevel: 'high'
            };
            const result = service.assessMotivationalContext(mockConversationHistory, poorSessionMetrics, mockEngagementAnalysis);
            expect(result.userFrustrationLevel).toBeGreaterThan(0.5);
            expect(result.needsEncouragement).toBe(true);
        });
    });
    describe('generateMotivationalSupport', () => {
        it('should generate appropriate motivational messages', async () => {
            const mockMotivationalContext = {
                userFrustrationLevel: 0.6,
                recentPerformance: 0.4,
                sessionDuration: 10,
                errorCount: 8,
                successCount: 2,
                needsEncouragement: true,
                motivationType: 'effort'
            };
            const mockBedrockResponse = {
                content: JSON.stringify({
                    message: "You're working so hard! Every mistake is helping you learn.",
                    type: "effort",
                    personalizedElements: ["effort_recognition", "learning_mindset"]
                }),
                usage: { inputTokens: 100, outputTokens: 50 },
                stopReason: 'end_turn'
            };
            mockBedrockClient.invokeModel.mockResolvedValue(mockBedrockResponse);
            const result = await service.generateMotivationalSupport(mockMotivationalContext, mockUserProfile, {});
            expect(result.message).toBeTruthy();
            expect(result.type).toBe('effort');
            expect(result.timing).toBeGreaterThan(0);
            expect(Array.isArray(result.personalizedElements)).toBe(true);
            expect(mockBedrockClient.invokeModel).toHaveBeenCalled();
        });
        it('should provide fallback message when AI service fails', async () => {
            const mockMotivationalContext = {
                userFrustrationLevel: 0.3,
                recentPerformance: 0.8,
                sessionDuration: 5,
                errorCount: 2,
                successCount: 8,
                needsEncouragement: false,
                motivationType: 'progress'
            };
            mockBedrockClient.invokeModel.mockRejectedValue(new Error('Service unavailable'));
            const result = await service.generateMotivationalSupport(mockMotivationalContext, mockUserProfile, {});
            expect(result.message).toBeTruthy();
            expect(result.type).toBe('progress');
            expect(result.timing).toBeGreaterThan(0);
        });
    });
    describe('createCorrectionStrategy', () => {
        it('should create appropriate correction strategies', async () => {
            const mockErrorPriorities = [
                {
                    errorType: 'grammar',
                    severity: 'high',
                    impact: 0.8,
                    frequency: 0.6,
                    learningValue: 0.9,
                    priority: 0.8
                },
                {
                    errorType: 'vocabulary',
                    severity: 'medium',
                    impact: 0.6,
                    frequency: 0.4,
                    learningValue: 0.7,
                    priority: 0.6
                }
            ];
            const result = await service.createCorrectionStrategy(mockErrorPriorities, mockUserProfile, {});
            expect(result.corrections).toHaveLength(2);
            expect(result.approach).toBeTruthy();
            expect(Array.isArray(result.sequencing)).toBe(true);
            expect(result.sequencing).toHaveLength(2);
            // Should prioritize grammar error first
            expect(result.sequencing[0]).toBe('grammar');
        });
        it('should handle empty error list gracefully', async () => {
            const result = await service.createCorrectionStrategy([], mockUserProfile, {});
            expect(result.corrections).toHaveLength(0);
            expect(result.approach).toBe('positive_reinforcement');
            expect(result.sequencing).toHaveLength(0);
        });
        it('should limit corrections to avoid overwhelming user', async () => {
            const manyErrors = Array.from({ length: 10 }, (_, i) => ({
                errorType: `error-${i}`,
                severity: 'medium',
                impact: 0.5,
                frequency: 0.5,
                learningValue: 0.5,
                priority: 0.5 - i * 0.05
            }));
            const result = await service.createCorrectionStrategy(manyErrors, mockUserProfile, {});
            // Should limit to top 3 errors
            expect(result.corrections.length).toBeLessThanOrEqual(3);
            expect(result.sequencing.length).toBeLessThanOrEqual(3);
        });
    });
    describe('edge cases and error handling', () => {
        it('should handle missing language analysis gracefully', async () => {
            const emptyAnalysis = {
                grammarScore: 0,
                fluencyScore: 0,
                vocabularyLevel: 0,
                detectedErrors: [],
                suggestions: [],
                sentiment: 0
            };
            mockEngagementService.analyzeEngagement.mockReturnValue({
                overallEngagement: 50,
                riskLevel: 'low',
                recommendedActions: [],
                detectedPatterns: [],
                interventionUrgency: 'none'
            });
            const result = await service.determineFeedbackTiming(mockConversationHistory, mockConversationHistory[1], emptyAnalysis, mockUserProfile, mockSessionMetrics);
            expect(result).toBeDefined();
            expect(typeof result.shouldProvideFeedback).toBe('boolean');
        });
        it('should handle beginner users appropriately', async () => {
            const beginnerUser = {
                ...mockUserProfile,
                currentLevel: 'beginner'
            };
            const result = service.prioritizeErrors(mockLanguageAnalysis, beginnerUser);
            expect(result).toBeDefined();
            // Beginner users should have different error severity assessments
            expect(result[0].severity).toBeOneOf(['low', 'medium', 'high', 'critical']);
        });
        it('should handle advanced users appropriately', async () => {
            const advancedUser = {
                ...mockUserProfile,
                currentLevel: 'advanced'
            };
            const result = service.prioritizeErrors(mockLanguageAnalysis, advancedUser);
            expect(result).toBeDefined();
            // Advanced users should have higher severity for grammar errors
            if (result.length > 0) {
                expect(result[0].severity).toBeOneOf(['medium', 'high', 'critical']);
            }
        });
    });
});
// Helper function for Jest custom matchers
expect.extend({
    toBeOneOf(received, expected) {
        const pass = expected.includes(received);
        if (pass) {
            return {
                message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
                pass: true,
            };
        }
        else {
            return {
                message: () => `expected ${received} to be one of ${expected.join(', ')}`,
                pass: false,
            };
        }
    },
});
