"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conversation_orchestrator_1 = require("../conversation-orchestrator");
const constants_1 = require("@/shared/constants");
// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@/agents/coordination/agent-factory');
jest.mock('@/agents/personalities/friendly-tutor');
describe('DynamoDBConversationOrchestrator', () => {
    let orchestrator;
    let mockDynamoClient;
    let mockAgentFactory;
    let mockAgent;
    let mockUserProfile;
    beforeEach(() => {
        // Setup mocks
        mockDynamoClient = {
            send: jest.fn()
        };
        mockAgent = {
            getPersonality: jest.fn().mockReturnValue({
                id: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
                name: 'Maya - Friendly Tutor',
                conversationStyle: 'friendly-tutor'
            }),
            generateSupportiveResponse: jest.fn()
        };
        mockAgentFactory = {
            recommendAgent: jest.fn().mockReturnValue({
                agentId: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
                confidence: 0.8,
                reason: 'Test recommendation'
            }),
            getAgent: jest.fn().mockReturnValue(mockAgent),
            recommendAgentHandoff: jest.fn().mockReturnValue(null)
        };
        mockUserProfile = {
            userId: 'test-user-123',
            targetLanguage: 'en-US',
            nativeLanguage: 'es-ES',
            currentLevel: 'intermediate',
            learningGoals: ['conversation-fluency'],
            preferredAgents: [constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR],
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
        // Create orchestrator instance
        orchestrator = new conversation_orchestrator_1.DynamoDBConversationOrchestrator('test-users-table', 'test-sessions-table', 'us-east-1');
        // Mock DynamoDB client
        orchestrator.dynamoClient = mockDynamoClient;
        orchestrator.agentFactory = mockAgentFactory;
    });
    describe('createSession', () => {
        test('creates a new conversation session successfully', async () => {
            // Mock DynamoDB responses
            mockDynamoClient.send
                .mockResolvedValueOnce({ Item: mockUserProfile }) // getUserProfile
                .mockResolvedValueOnce({}); // PutCommand for session
            mockAgent.generateSupportiveResponse.mockResolvedValue({
                content: 'Hello! Ready to practice?',
                feedback: [],
                audioInstructions: null
            });
            const request = {
                userId: 'test-user-123',
                agentId: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
                topic: 'Travel and Culture',
                difficulty: 'medium'
            };
            const result = await orchestrator.createSession(request);
            expect(result.sessionId).toBeDefined();
            expect(result.agentPersonality.id).toBe(constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR);
            expect(result.initialMessage).toContain('Maya');
            expect(mockDynamoClient.send).toHaveBeenCalledTimes(2);
        });
        test('handles user not found error', async () => {
            mockDynamoClient.send.mockResolvedValueOnce({ Item: null });
            const request = {
                userId: 'nonexistent-user',
                agentId: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR
            };
            await expect(orchestrator.createSession(request)).rejects.toThrow('User profile not found');
        });
    });
    describe('sendMessage', () => {
        test('processes user message and generates agent response', async () => {
            const sessionId = 'test-session-123';
            const mockSession = {
                sessionId,
                userId: 'test-user-123',
                agentId: constants_1.AGENT_PERSONALITIES.FRIENDLY_TUTOR,
                status: 'active',
                startTime: new Date(),
                messages: []
            };
            // Setup session context
            orchestrator.sessionContexts.set(sessionId, {
                sessionId,
                userId: 'test-user-123',
                conversationHistory: [],
                userProfile: mockUserProfile,
                currentTopic: 'Travel and Culture'
            });
            orchestrator.activeAgents.set(sessionId, mockAgent);
            mockDynamoClient.send
                .mockResolvedValueOnce({ Items: [mockSession] }) // getSessionFromDB
                .mockResolvedValueOnce({}) // updateSessionWithMessages
                .mockResolvedValueOnce({}) // updatePerformanceMetrics
                .mockResolvedValueOnce({}); // storeFeedback
            mockAgent.generateSupportiveResponse.mockResolvedValue({
                content: 'Great job! Your pronunciation is improving.',
                feedback: [{
                        feedbackId: 'feedback-123',
                        sessionId,
                        messageId: 'msg-123',
                        type: 'encouragement',
                        content: 'Well done!',
                        deliveredAt: new Date()
                    }],
                audioInstructions: null
            });
            const request = {
                sessionId,
                content: 'I went to Paris last summer and it was amazing!'
            };
            const result = await orchestrator.sendMessage(request);
            expect(result.messageId).toBeDefined();
            expect(result.agentResponse).toBe('Great job! Your pronunciation is improving.');
            expect(result.feedback).toHaveLength(1);
            expect(mockAgent.generateSupportiveResponse).toHaveBeenCalled();
        });
        test('handles inactive session error', async () => {
            const sessionId = 'inactive-session';
            const mockSession = {
                sessionId,
                status: 'completed'
            };
            mockDynamoClient.send.mockResolvedValueOnce({ Items: [mockSession] });
            const request = {
                sessionId,
                content: 'Hello'
            };
            await expect(orchestrator.sendMessage(request)).rejects.toThrow('Session not found or not active');
        });
    });
    describe('endSession', () => {
        test('ends session and updates metrics', async () => {
            const sessionId = 'test-session-123';
            const mockSession = {
                sessionId,
                userId: 'test-user-123',
                startTime: new Date(Date.now() - 300000), // 5 minutes ago
                messages: [
                    { messageId: 'msg-1', content: 'Hello' },
                    { messageId: 'msg-2', content: 'Hi there!' }
                ],
                performanceMetrics: {
                    wordsSpoken: 10,
                    errorsCount: 1
                }
            };
            mockDynamoClient.send
                .mockResolvedValueOnce({ Items: [mockSession] }) // getSessionFromDB
                .mockResolvedValueOnce({}) // UpdateCommand for session
                .mockResolvedValueOnce({}); // updateUserProgress
            await orchestrator.endSession(sessionId);
            expect(mockDynamoClient.send).toHaveBeenCalledTimes(3);
            // Verify session cleanup
            expect(orchestrator.activeAgents.has(sessionId)).toBe(false);
            expect(orchestrator.sessionContexts.has(sessionId)).toBe(false);
        });
    });
    describe('getUserSessions', () => {
        test('retrieves user session history', async () => {
            const userId = 'test-user-123';
            const mockSessions = [
                { sessionId: 'session-1', userId, startTime: new Date() },
                { sessionId: 'session-2', userId, startTime: new Date() }
            ];
            mockDynamoClient.send.mockResolvedValueOnce({ Items: mockSessions });
            const result = await orchestrator.getUserSessions(userId, 5);
            expect(result).toHaveLength(2);
            expect(result[0].sessionId).toBe('session-1');
            expect(mockDynamoClient.send).toHaveBeenCalledWith(expect.objectContaining({
                input: expect.objectContaining({
                    IndexName: 'UserSessionIndex',
                    KeyConditionExpression: 'userId = :userId'
                })
            }));
        });
    });
});
