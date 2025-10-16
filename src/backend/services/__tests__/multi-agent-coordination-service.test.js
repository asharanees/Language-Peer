"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multi_agent_coordination_service_1 = require("../multi-agent-coordination-service");
// Mock dependencies
jest.mock('../../../agents/coordination/agent-factory');
jest.mock('../bedrock-client');
jest.mock('../engagement-detection-service');
jest.mock('../intelligent-feedback-timing-service');
describe('MultiAgentCoordinationService', () => {
    let service;
    let mockAgentFactory;
    let mockBedrockClient;
    let mockEngagementService;
    let mockFeedbackService;
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
            content: 'I am good, thank you!',
            timestamp: new Date(Date.now() - 20000),
            transcriptionConfidence: 0.85
        }
    ];
    beforeEach(() => {
        mockAgentFactory = {
            createAgent: jest.fn(),
            getAvailableAgents: jest.fn(),
            getAgentCapabilities: jest.fn()
        };
        mockBedrockClient = {
            invokeModel: jest.fn()
        };
        mockEngagementService = {
            analyzeEngagement: jest.fn()
        };
        mockFeedbackService = {
            determineFeedbackTiming: jest.fn()
        };
        service = new multi_agent_coordination_service_1.MultiAgentCoordinationService(mockAgentFactory, mockBedrockClient, mockEngagementService, mockFeedbackService);
    });
    describe('initializeCoordination', () => {
        it('should initialize coordination strategy for new session', async () => {
            const sessionId = 'session-123';
            const sessionGoals = ['conversation-fluency', 'grammar-accuracy'];
            const strategy = await service.initializeCoordination(sessionId, mockUserProfile, sessionGoals);
            expect(strategy).toBeDefined();
            expect(strategy.primaryAgent).toBeTruthy();
            expect(strategy.sessionGoals).toEqual(sessionGoals);
            expect(['sequential', 'collaborative', 'competitive', 'adaptive']).toContain(strategy.coordinationMode);
            expect(Array.isArray(strategy.supportingAgents)).toBe(true);
            expect(Array.isArray(strategy.transitionTriggers)).toBe(true);
        });
        it('should respect user preferred agents', async () => {
            const sessionId = 'session-123';
            const sessionGoals = ['conversation-fluency'];
            const preferredAgents = ['strict-teacher'];
            const strategy = await service.initializeCoordination(sessionId, mockUserProfile, sessionGoals, preferredAgents);
            expect(strategy.primaryAgent).toBe('strict-teacher');
        });
        it('should select appropriate agent for beginner users', async () => {
            const beginnerProfile = {
                ...mockUserProfile,
                currentLevel: 'beginner'
            };
            const strategy = await service.initializeCoordination('session-123', beginnerProfile, ['conversation-fluency']);
            expect(strategy.primaryAgent).toBe('friendly-tutor');
        });
        it('should select pronunciation coach for pronunciation goals', async () => {
            const strategy = await service.initializeCoordination('session-123', mockUserProfile, ['pronunciation-improvement']);
            expect(strategy.primaryAgent).toBe('pronunciation-coach');
        });
    });
    describe('coordinateAgents', () => {
        beforeEach(async () => {
            // Initialize a session first
            await service.initializeCoordination('session-123', mockUserProfile, ['conversation-fluency']);
        });
        it('should maintain current agent when performing well', async () => {
            mockEngagementService.analyzeEngagement.mockReturnValue({
                overallEngagement: 80,
                riskLevel: 'low',
                recommendedActions: [],
                detectedPatterns: [],
                interventionUrgency: 'none'
            });
            const decision = await service.coordinateAgents('session-123', mockConversationHistory, mockSessionMetrics, mockUserProfile);
            expect(decision.action).toBe('maintain');
            expect(decision.reason).toContain('performing well');
        });
        it('should suggest transition when engagement drops', async () => {
            mockEngagementService.analyzeEngagement.mockReturnValue({
                overallEngagement: 30, // Low engagement
                riskLevel: 'high',
                recommendedActions: [],
                detectedPatterns: ['low_engagement'],
                interventionUrgency: 'high'
            });
            const decision = await service.coordinateAgents('session-123', mockConversationHistory, mockSessionMetrics, mockUserProfile);
            expect(['transition', 'collaborate']).toContain(decision.action);
            if (decision.action === 'transition') {
                expect(decision.targetAgent).toBeTruthy();
                expect(decision.reason).toContain('engagement');
            }
        });
        it('should handle non-existent session gracefully', async () => {
            await expect(service.coordinateAgents('non-existent-session', mockConversationHistory, mockSessionMetrics, mockUserProfile)).rejects.toThrow('No active session found');
        });
    });
    describe('executeAgentTransition', () => {
        beforeEach(async () => {
            await service.initializeCoordination('session-123', mockUserProfile, ['conversation-fluency']);
        });
        it('should execute smooth agent transition', async () => {
            const result = await service.executeAgentTransition('session-123', 'strict-teacher', 'smooth', 'User ready for more challenging interaction');
            expect(result.success).toBe(true);
            expect(result.transitionMessage).toBeTruthy();
            expect(result.newAgentIntroduction).toBeTruthy();
        });
        it('should execute explicit agent transition', async () => {
            const result = await service.executeAgentTransition('session-123', 'pronunciation-coach', 'explicit', 'Focus on pronunciation improvement');
            expect(result.success).toBe(true);
            expect(result.transitionMessage).toContain('hand you over');
        });
        it('should handle transition errors gracefully', async () => {
            const result = await service.executeAgentTransition('non-existent-session', 'strict-teacher', 'smooth', 'Test transition');
            expect(result.success).toBe(false);
        });
    });
    describe('manageCollaboration', () => {
        beforeEach(async () => {
            await service.initializeCoordination('session-123', mockUserProfile, ['conversation-fluency', 'grammar-accuracy']);
        });
        it('should plan peer review collaboration', async () => {
            const result = await service.manageCollaboration('session-123', ['friendly-tutor', 'strict-teacher'], 'peer_review');
            expect(result.collaborationPlan).toBeDefined();
            expect(result.collaborationPlan.roles).toBeDefined();
            expect(result.collaborationPlan.sequence).toHaveLength(3);
            expect(result.coordinationInstructions).toContain('peer_review');
        });
        it('should plan specialized support collaboration', async () => {
            const result = await service.manageCollaboration('session-123', ['conversation-partner', 'pronunciation-coach'], 'specialized_support');
            expect(result.collaborationPlan.roles['conversation-partner']).toBe('main_tutor');
            expect(result.collaborationPlan.roles['pronunciation-coach']).toBe('specialist');
        });
    });
    describe('optimizeAgentPerformance', () => {
        beforeEach(async () => {
            await service.initializeCoordination('session-123', mockUserProfile, ['conversation-fluency']);
        });
        it('should provide optimization recommendations', async () => {
            const performanceData = [
                {
                    agentId: 'friendly-tutor',
                    sessionTime: 600,
                    userEngagement: 45,
                    learningProgress: 70,
                    errorReduction: 60,
                    userSatisfaction: 65,
                    effectivenessScore: 60
                }
            ];
            const userFeedback = {
                satisfaction: 60,
                preferences: ['more interactive'],
                complaints: ['too slow']
            };
            const result = await service.optimizeAgentPerformance('session-123', performanceData, userFeedback);
            expect(result.optimizations).toHaveLength(1);
            expect(result.optimizations[0].agentId).toBe('friendly-tutor');
            expect(result.optimizations[0].adjustments).toContain('Increase interactivity and engagement techniques');
            expect(Array.isArray(result.strategicRecommendations)).toBe(true);
        });
    });
    describe('generateSessionAnalytics', () => {
        beforeEach(async () => {
            await service.initializeCoordination('session-123', mockUserProfile, ['conversation-fluency']);
        });
        it('should generate comprehensive session analytics', async () => {
            const analytics = await service.generateSessionAnalytics('session-123');
            expect(analytics.agentEffectiveness).toBeDefined();
            expect(typeof analytics.coordinationEfficiency).toBe('number');
            expect(analytics.userExperience).toBeDefined();
            expect(analytics.userExperience.satisfaction).toBeGreaterThanOrEqual(0);
            expect(analytics.userExperience.engagement).toBeGreaterThanOrEqual(0);
            expect(analytics.userExperience.learningProgress).toBeGreaterThanOrEqual(0);
            expect(analytics.recommendations).toBeDefined();
            expect(Array.isArray(analytics.recommendations.agentOptimizations)).toBe(true);
            expect(Array.isArray(analytics.recommendations.strategyImprovements)).toBe(true);
            expect(Array.isArray(analytics.recommendations.futureCoordination)).toBe(true);
        });
    });
    describe('resolveAgentConflicts', () => {
        beforeEach(async () => {
            await service.initializeCoordination('session-123', mockUserProfile, ['conversation-fluency', 'grammar-accuracy']);
        });
        it('should resolve style mismatch conflicts', async () => {
            const result = await service.resolveAgentConflicts('session-123', 'style_mismatch', ['friendly-tutor', 'strict-teacher'], 'Agents have conflicting teaching approaches');
            expect(result.resolution).toBeDefined();
            expect(['mediate', 'prioritize', 'separate', 'replace']).toContain(result.resolution.action);
            expect(Array.isArray(result.preventionMeasures)).toBe(true);
        });
    });
});
