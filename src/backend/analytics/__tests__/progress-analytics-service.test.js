"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const progress_analytics_service_1 = require("../progress-analytics-service");
const client_kinesis_1 = require("@aws-sdk/client-kinesis");
// Mock AWS SDK
jest.mock('@aws-sdk/client-kinesis');
const mockSend = jest.fn();
const mockKinesisClient = {
    send: mockSend
};
// Mock PutRecordsCommand to capture constructor arguments
const mockPutRecordsCommand = jest.fn();
client_kinesis_1.PutRecordsCommand.mockImplementation((input) => {
    const command = { input };
    mockPutRecordsCommand(input);
    return command;
});
client_kinesis_1.KinesisClient.mockImplementation(() => mockKinesisClient);
describe('KinesisProgressAnalyticsService', () => {
    let analyticsService;
    const mockStreamName = 'test-analytics-stream';
    const mockUserId = 'user-123';
    const mockSessionId = 'session-456';
    beforeEach(() => {
        jest.clearAllMocks();
        mockPutRecordsCommand.mockClear();
        analyticsService = new progress_analytics_service_1.KinesisProgressAnalyticsService(mockStreamName, 'us-east-1', 5);
        // Mock successful Kinesis responses
        mockSend.mockResolvedValue({
            Records: [{ RecordId: 'record-1', ShardId: 'shard-1', SequenceNumber: '123' }]
        });
    });
    afterEach(() => {
        jest.clearAllTimers();
    });
    describe('Kinesis Event Streaming', () => {
        it('should record session start events with correct data structure', async () => {
            const sessionData = {
                agentId: 'friendly-tutor',
                topic: 'daily-conversation',
                difficulty: 'medium',
                userLevel: 'intermediate'
            };
            await analyticsService.recordSessionStart(mockUserId, mockSessionId, sessionData);
            // Force buffer flush to trigger Kinesis call
            await analyticsService.flushBuffer();
            expect(mockSend).toHaveBeenCalled();
            expect(mockPutRecordsCommand).toHaveBeenCalled();
            // Get the input that was passed to PutRecordsCommand constructor
            const commandInput = mockPutRecordsCommand.mock.calls[0][0];
            expect(commandInput.StreamName).toBe(mockStreamName);
            expect(commandInput.Records).toHaveLength(1);
            expect(commandInput.Records[0].PartitionKey).toBe(mockUserId);
            expect(commandInput.Records[0].Data).toBeInstanceOf(Uint8Array);
            const sentDataBytes = commandInput.Records[0].Data;
            const sentData = JSON.parse(new TextDecoder().decode(sentDataBytes));
            expect(sentData).toMatchObject({
                eventType: 'session_start',
                userId: mockUserId,
                sessionId: mockSessionId,
                data: sessionData
            });
            expect(sentData.timestamp).toBeDefined();
        });
        it('should record session end events with performance metrics', async () => {
            const sessionMetrics = {
                duration: 1800, // 30 minutes
                wordsSpoken: 250,
                grammarAccuracy: 0.85,
                fluencyScore: 0.78,
                vocabularyUsed: ['hello', 'conversation', 'practice'],
                errorsCount: 3,
                improvementsShown: 2,
                averageResponseTime: 2.5
            };
            await analyticsService.recordSessionEnd(mockUserId, mockSessionId, sessionMetrics);
            await analyticsService.flushBuffer();
            expect(mockSend).toHaveBeenCalled();
            expect(mockPutRecordsCommand).toHaveBeenCalled();
            const commandInput = mockPutRecordsCommand.mock.calls[0][0];
            const sentDataBytes = commandInput.Records[0].Data;
            const sentData = JSON.parse(new TextDecoder().decode(sentDataBytes));
            expect(sentData).toMatchObject({
                eventType: 'session_end',
                userId: mockUserId,
                sessionId: mockSessionId,
                data: sessionMetrics
            });
        });
        it('should record user interaction events', async () => {
            const interactionData = {
                buttonClicked: 'feedback-helpful',
                agentSelected: 'pronunciation-coach',
                topicChanged: 'business-english'
            };
            await analyticsService.recordUserInteraction(mockUserId, 'ui_interaction', interactionData);
            await analyticsService.flushBuffer();
            const commandInput = mockPutRecordsCommand.mock.calls[0][0];
            const sentDataBytes = commandInput.Records[0].Data;
            const sentData = JSON.parse(new TextDecoder().decode(sentDataBytes));
            expect(sentData).toMatchObject({
                eventType: 'user_interaction',
                userId: mockUserId,
                data: {
                    interactionType: 'ui_interaction',
                    ...interactionData
                }
            });
        });
        it('should record progress updates with improvement calculations', async () => {
            const oldMetrics = {
                overallImprovement: 0.65,
                grammarProgress: 0.70,
                fluencyProgress: 0.60,
                vocabularyGrowth: 0.55,
                confidenceLevel: 0.65,
                sessionsCompleted: 10,
                totalPracticeTime: 18000,
                streakDays: 5
            };
            const newMetrics = {
                overallImprovement: 0.75,
                grammarProgress: 0.80,
                fluencyProgress: 0.70,
                vocabularyGrowth: 0.65,
                confidenceLevel: 0.75,
                sessionsCompleted: 11,
                totalPracticeTime: 20000,
                streakDays: 6
            };
            await analyticsService.recordProgressUpdate(mockUserId, oldMetrics, newMetrics);
            await analyticsService.flushBuffer();
            const commandInput = mockPutRecordsCommand.mock.calls[0][0];
            const sentDataBytes = commandInput.Records[0].Data;
            const sentData = JSON.parse(new TextDecoder().decode(sentDataBytes));
            expect(sentData.data.improvements).toEqual({
                grammar: 0.10,
                fluency: 0.10,
                vocabulary: 0.10,
                confidence: 0.10
            });
        });
        it('should record milestone achievements', async () => {
            const milestone = {
                id: 'milestone-1',
                title: 'First Week Streak',
                category: 'engagement',
                achievedAt: new Date()
            };
            await analyticsService.recordMilestoneAchievement(mockUserId, milestone);
            await analyticsService.flushBuffer();
            const commandInput = mockPutRecordsCommand.mock.calls[0][0];
            const sentDataBytes = commandInput.Records[0].Data;
            const sentData = JSON.parse(new TextDecoder().decode(sentDataBytes));
            expect(sentData).toMatchObject({
                eventType: 'milestone_achieved',
                userId: mockUserId,
                data: {
                    milestoneId: milestone.id,
                    milestoneTitle: milestone.title,
                    category: milestone.category,
                    achievedAt: milestone.achievedAt
                }
            });
        });
        it('should buffer events and flush when buffer size is reached', async () => {
            // Add 5 events (buffer size is 5 for this test instance)
            for (let i = 0; i < 5; i++) {
                await analyticsService.recordUserInteraction(mockUserId, 'test_interaction', { index: i });
            }
            // Should have triggered flush automatically
            expect(mockSend).toHaveBeenCalledTimes(1);
            const commandInput = mockPutRecordsCommand.mock.calls[0][0];
            const records = commandInput.Records;
            expect(records).toHaveLength(5);
        });
        it('should handle Kinesis errors gracefully and retain events for retry', async () => {
            mockSend.mockRejectedValueOnce(new Error('Kinesis service unavailable'));
            await analyticsService.recordUserInteraction(mockUserId, 'test_interaction', {});
            await analyticsService.flushBuffer();
            // Should have attempted to send
            expect(mockSend).toHaveBeenCalled();
            // Events should still be in buffer for retry (check buffer length)
            const bufferLength = analyticsService.eventBuffer.length;
            expect(bufferLength).toBeGreaterThan(0);
        });
        it('should batch multiple events with correct partition keys', async () => {
            const user1 = 'user-1';
            const user2 = 'user-2';
            await analyticsService.recordUserInteraction(user1, 'interaction1', {});
            await analyticsService.recordUserInteraction(user2, 'interaction2', {});
            await analyticsService.recordUserInteraction(user1, 'interaction3', {});
            await analyticsService.flushBuffer();
            const commandInput = mockPutRecordsCommand.mock.calls[0][0];
            const records = commandInput.Records;
            expect(records[0].PartitionKey).toBe(user1);
            expect(records[1].PartitionKey).toBe(user2);
            expect(records[2].PartitionKey).toBe(user1);
        });
    });
    describe('Progress Calculation Accuracy', () => {
        it('should calculate progress metrics accurately from session data', async () => {
            const mockSessions = [
                {
                    sessionId: 'session-1',
                    userId: mockUserId,
                    agentId: 'friendly-tutor',
                    startTime: new Date('2024-01-01'),
                    endTime: new Date('2024-01-01'),
                    topic: 'greetings',
                    difficulty: 'easy',
                    messages: [],
                    performanceMetrics: {
                        duration: 1200,
                        wordsSpoken: 100,
                        grammarAccuracy: 0.8,
                        fluencyScore: 0.7,
                        vocabularyUsed: ['hello', 'good', 'morning'],
                        errorsCount: 2,
                        improvementsShown: 1,
                        averageResponseTime: 2.0
                    },
                    feedbackProvided: [],
                    status: 'completed'
                },
                {
                    sessionId: 'session-2',
                    userId: mockUserId,
                    agentId: 'conversation-partner',
                    startTime: new Date('2024-01-02'),
                    endTime: new Date('2024-01-02'),
                    topic: 'weather',
                    difficulty: 'medium',
                    messages: [],
                    performanceMetrics: {
                        duration: 1800,
                        wordsSpoken: 150,
                        grammarAccuracy: 0.85,
                        fluencyScore: 0.75,
                        vocabularyUsed: ['weather', 'sunny', 'cloudy', 'temperature'],
                        errorsCount: 1,
                        improvementsShown: 2,
                        averageResponseTime: 1.8
                    },
                    feedbackProvided: [],
                    status: 'completed'
                }
            ];
            const progressMetrics = await analyticsService.calculateProgressMetrics(mockSessions);
            expect(progressMetrics).toMatchObject({
                grammarProgress: 0.825, // Average of 0.8 and 0.85
                fluencyProgress: 0.725, // Average of 0.7 and 0.75
                sessionsCompleted: 2,
                totalPracticeTime: 3000 // 1200 + 1800
            });
            expect(progressMetrics.vocabularyGrowth).toBeGreaterThan(0);
            expect(progressMetrics.overallImprovement).toBeGreaterThan(0);
            expect(progressMetrics.confidenceLevel).toBeGreaterThan(0);
        });
        it('should handle empty session data gracefully', async () => {
            const progressMetrics = await analyticsService.calculateProgressMetrics([]);
            expect(progressMetrics).toEqual({
                overallImprovement: 0,
                grammarProgress: 0,
                fluencyProgress: 0,
                vocabularyGrowth: 0,
                confidenceLevel: 0.5,
                sessionsCompleted: 0,
                totalPracticeTime: 0,
                streakDays: 0
            });
        });
        it('should calculate streak days correctly', async () => {
            const today = new Date();
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
            const consecutiveSessions = [
                {
                    sessionId: 'session-1',
                    userId: mockUserId,
                    agentId: 'friendly-tutor',
                    startTime: today,
                    topic: 'test',
                    difficulty: 'easy',
                    messages: [],
                    performanceMetrics: {
                        duration: 1200,
                        wordsSpoken: 100,
                        grammarAccuracy: 0.8,
                        fluencyScore: 0.7,
                        vocabularyUsed: ['test'],
                        errorsCount: 0,
                        improvementsShown: 0,
                        averageResponseTime: 2.0
                    },
                    feedbackProvided: [],
                    status: 'completed'
                },
                {
                    sessionId: 'session-2',
                    userId: mockUserId,
                    agentId: 'friendly-tutor',
                    startTime: yesterday,
                    topic: 'test',
                    difficulty: 'easy',
                    messages: [],
                    performanceMetrics: {
                        duration: 1200,
                        wordsSpoken: 100,
                        grammarAccuracy: 0.8,
                        fluencyScore: 0.7,
                        vocabularyUsed: ['test'],
                        errorsCount: 0,
                        improvementsShown: 0,
                        averageResponseTime: 2.0
                    },
                    feedbackProvided: [],
                    status: 'completed'
                },
                {
                    sessionId: 'session-3',
                    userId: mockUserId,
                    agentId: 'friendly-tutor',
                    startTime: twoDaysAgo,
                    topic: 'test',
                    difficulty: 'easy',
                    messages: [],
                    performanceMetrics: {
                        duration: 1200,
                        wordsSpoken: 100,
                        grammarAccuracy: 0.8,
                        fluencyScore: 0.7,
                        vocabularyUsed: ['test'],
                        errorsCount: 0,
                        improvementsShown: 0,
                        averageResponseTime: 2.0
                    },
                    feedbackProvided: [],
                    status: 'completed'
                }
            ];
            const progressMetrics = await analyticsService.calculateProgressMetrics(consecutiveSessions);
            expect(progressMetrics.streakDays).toBeGreaterThanOrEqual(2);
        });
        it('should normalize vocabulary growth correctly', async () => {
            const sessionsWithVocabulary = [];
            // Create sessions with increasing vocabulary
            for (let i = 0; i < 5; i++) {
                const vocabulary = Array.from({ length: (i + 1) * 10 }, (_, idx) => `word${idx}`);
                sessionsWithVocabulary.push({
                    sessionId: `session-${i}`,
                    userId: mockUserId,
                    agentId: 'friendly-tutor',
                    startTime: new Date(),
                    topic: 'vocabulary',
                    difficulty: 'medium',
                    messages: [],
                    performanceMetrics: {
                        duration: 1200,
                        wordsSpoken: 100,
                        grammarAccuracy: 0.8,
                        fluencyScore: 0.7,
                        vocabularyUsed: vocabulary,
                        errorsCount: 0,
                        improvementsShown: 0,
                        averageResponseTime: 2.0
                    },
                    feedbackProvided: [],
                    status: 'completed'
                });
            }
            const progressMetrics = await analyticsService.calculateProgressMetrics(sessionsWithVocabulary);
            // Should be normalized between 0 and 1
            expect(progressMetrics.vocabularyGrowth).toBeGreaterThanOrEqual(0);
            expect(progressMetrics.vocabularyGrowth).toBeLessThanOrEqual(1);
        });
    });
    describe('Dashboard Data Aggregation and Visualization', () => {
        it('should generate comprehensive progress reports with all required sections', async () => {
            const progressReport = await analyticsService.generateProgressReport(mockUserId, 'month');
            expect(progressReport).toMatchObject({
                userId: mockUserId,
                timeframe: 'month',
                overallProgress: expect.any(Object),
                trends: expect.any(Array),
                insights: expect.any(Array),
                recommendations: expect.any(Array),
                generatedAt: expect.any(Date)
            });
            // Verify progress metrics structure
            expect(progressReport.overallProgress).toHaveProperty('grammarProgress');
            expect(progressReport.overallProgress).toHaveProperty('fluencyProgress');
            expect(progressReport.overallProgress).toHaveProperty('vocabularyGrowth');
            expect(progressReport.overallProgress).toHaveProperty('confidenceLevel');
        });
        it('should generate progress trends with correct data structure', async () => {
            const trends = await analyticsService.getProgressTrends(mockUserId, ['grammar', 'fluency', 'vocabulary'], 'week');
            expect(trends).toHaveLength(3);
            trends.forEach(trend => {
                expect(trend).toMatchObject({
                    metric: expect.stringMatching(/^(grammar|fluency|vocabulary)$/),
                    direction: expect.stringMatching(/^(improving|declining|stable)$/),
                    changeRate: expect.any(Number),
                    timeframe: 'week',
                    dataPoints: expect.any(Array)
                });
                // Verify data points structure
                trend.dataPoints.forEach(point => {
                    expect(point).toHaveProperty('date');
                    expect(point).toHaveProperty('value');
                    expect(point.value).toBeGreaterThanOrEqual(0);
                    expect(point.value).toBeLessThanOrEqual(1);
                });
            });
        });
        it('should generate learning insights with actionable recommendations', async () => {
            const mockSessionHistory = [
                {
                    sessionId: 'session-1',
                    userId: mockUserId,
                    agentId: 'friendly-tutor',
                    startTime: new Date(),
                    topic: 'conversation',
                    difficulty: 'medium',
                    messages: [],
                    performanceMetrics: {
                        duration: 1800,
                        wordsSpoken: 200,
                        grammarAccuracy: 0.9, // High grammar score
                        fluencyScore: 0.85,
                        vocabularyUsed: ['excellent', 'conversation', 'practice'],
                        errorsCount: 1,
                        improvementsShown: 0,
                        averageResponseTime: 2.0
                    },
                    feedbackProvided: [],
                    status: 'completed'
                }
            ];
            const insights = await analyticsService.getLearningInsights(mockUserId, mockSessionHistory);
            expect(insights).toBeInstanceOf(Array);
            expect(insights.length).toBeGreaterThan(0);
            insights.forEach(insight => {
                expect(insight).toMatchObject({
                    type: expect.stringMatching(/^(strength|weakness|milestone|pattern)$/),
                    category: expect.stringMatching(/^(grammar|fluency|vocabulary|engagement)$/),
                    description: expect.any(String),
                    confidence: expect.any(Number),
                    actionable: expect.any(Boolean)
                });
                expect(insight.confidence).toBeGreaterThanOrEqual(0);
                expect(insight.confidence).toBeLessThanOrEqual(1);
                if (insight.actionable) {
                    expect(insight).toHaveProperty('recommendation');
                }
            });
        });
        it('should generate contextual recommendations based on performance data', async () => {
            const lowGrammarMetrics = {
                overallImprovement: 0.5,
                grammarProgress: 0.4, // Low grammar
                fluencyProgress: 0.8,
                vocabularyGrowth: 0.7,
                confidenceLevel: 0.6,
                sessionsCompleted: 10,
                totalPracticeTime: 18000,
                streakDays: 2
            };
            const trends = [{
                    metric: 'grammar',
                    direction: 'declining',
                    changeRate: -10,
                    timeframe: 'week',
                    dataPoints: []
                }];
            const insights = [{
                    type: 'weakness',
                    category: 'grammar',
                    description: 'Grammar needs improvement',
                    confidence: 0.8,
                    actionable: true,
                    recommendation: 'Focus on grammar exercises'
                }];
            const recommendations = analyticsService.generateRecommendations(lowGrammarMetrics, trends, insights);
            expect(recommendations).toBeInstanceOf(Array);
            expect(recommendations.length).toBeGreaterThan(0);
            expect(recommendations).toContain('Focus on grammar exercises to improve accuracy');
            expect(recommendations).toContain('Focus on grammar exercises');
        });
        it('should handle different timeframes for trend analysis', async () => {
            const timeframes = ['week', 'month', 'year'];
            for (const timeframe of timeframes) {
                const trends = await analyticsService.getProgressTrends(mockUserId, ['grammar'], timeframe);
                expect(trends).toHaveLength(1);
                expect(trends[0].timeframe).toBe(timeframe);
                // Verify appropriate number of data points for timeframe
                const expectedDataPoints = timeframe === 'week' ? 8 : timeframe === 'month' ? 31 : 366;
                expect(trends[0].dataPoints).toHaveLength(expectedDataPoints);
            }
        });
        it('should calculate session frequency accurately', async () => {
            const recentSessions = [];
            const today = new Date();
            // Create sessions for 5 out of 7 days
            for (let i = 0; i < 5; i++) {
                const sessionDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
                recentSessions.push({
                    sessionId: `session-${i}`,
                    userId: mockUserId,
                    agentId: 'friendly-tutor',
                    startTime: sessionDate,
                    topic: 'test',
                    difficulty: 'easy',
                    messages: [],
                    performanceMetrics: {
                        duration: 1200,
                        wordsSpoken: 100,
                        grammarAccuracy: 0.8,
                        fluencyScore: 0.7,
                        vocabularyUsed: ['test'],
                        errorsCount: 0,
                        improvementsShown: 0,
                        averageResponseTime: 2.0
                    },
                    feedbackProvided: [],
                    status: 'completed'
                });
            }
            const frequency = analyticsService.calculateSessionFrequency(recentSessions);
            // Should be approximately 5/7 = 0.714
            expect(frequency).toBeCloseTo(0.714, 2);
        });
        it('should provide performance visualization data with proper formatting', async () => {
            const progressReport = await analyticsService.generateProgressReport(mockUserId, 'month');
            // Verify trends have visualization-ready data
            progressReport.trends.forEach(trend => {
                expect(trend.dataPoints).toBeInstanceOf(Array);
                expect(trend.dataPoints.length).toBeGreaterThan(0);
                trend.dataPoints.forEach(point => {
                    expect(point.date).toBeInstanceOf(Date);
                    expect(typeof point.value).toBe('number');
                    expect(point.value).toBeGreaterThanOrEqual(0);
                    expect(point.value).toBeLessThanOrEqual(1);
                });
            });
            // Verify insights are actionable for UI display
            progressReport.insights.forEach(insight => {
                expect(typeof insight.description).toBe('string');
                expect(insight.description.length).toBeGreaterThan(0);
                expect(typeof insight.confidence).toBe('number');
            });
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle malformed session data gracefully', async () => {
            const malformedSessions = [
                {
                    sessionId: 'session-1',
                    userId: mockUserId,
                    agentId: 'friendly-tutor',
                    startTime: new Date(),
                    topic: 'test',
                    difficulty: 'easy',
                    messages: [],
                    performanceMetrics: null, // Malformed data
                    feedbackProvided: [],
                    status: 'completed'
                }
            ];
            const progressMetrics = await analyticsService.calculateProgressMetrics(malformedSessions);
            // Should not throw and should provide default values
            expect(progressMetrics).toBeDefined();
            expect(progressMetrics.grammarProgress).toBe(0);
            expect(progressMetrics.fluencyProgress).toBe(0);
        });
        it('should handle network timeouts and retry logic', async () => {
            mockSend
                .mockRejectedValueOnce(new Error('Network timeout'))
                .mockResolvedValueOnce({ Records: [] });
            await analyticsService.recordUserInteraction(mockUserId, 'test', {});
            // First flush should fail
            await expect(analyticsService.flushBuffer()).resolves.not.toThrow();
            // Events should still be in buffer
            expect(analyticsService.eventBuffer.length).toBeGreaterThan(0);
        });
        it('should validate event data before streaming', async () => {
            // Test with invalid user ID
            await expect(analyticsService.recordUserInteraction('', 'test', {})).resolves.not.toThrow();
            // Test with null data
            await expect(analyticsService.recordUserInteraction(mockUserId, 'test', null)).resolves.not.toThrow();
        });
        it('should handle concurrent buffer flushes safely', async () => {
            // Add events to buffer
            await analyticsService.recordUserInteraction(mockUserId, 'test1', {});
            await analyticsService.recordUserInteraction(mockUserId, 'test2', {});
            // Trigger concurrent flushes
            const flush1 = analyticsService.flushBuffer();
            const flush2 = analyticsService.flushBuffer();
            await Promise.all([flush1, flush2]);
            // Should not cause errors or duplicate sends
            expect(mockSend).toHaveBeenCalledTimes(1);
        });
    });
    describe('Performance and Scalability', () => {
        it('should handle large batches of events efficiently', async () => {
            const startTime = Date.now();
            // Add 100 events
            for (let i = 0; i < 100; i++) {
                await analyticsService.recordUserInteraction(mockUserId, 'bulk_test', { index: i });
            }
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            // Should process 100 events in reasonable time (< 1 second)
            expect(processingTime).toBeLessThan(1000);
        });
        it('should maintain buffer size limits', async () => {
            // Add more events than buffer size
            for (let i = 0; i < 20; i++) {
                await analyticsService.recordUserInteraction(mockUserId, 'buffer_test', { index: i });
            }
            // Should have triggered multiple flushes
            expect(mockSend).toHaveBeenCalledTimes(4); // 20 events / 5 buffer size = 4 flushes
        });
        it('should optimize memory usage for large datasets', async () => {
            const largeSessions = [];
            // Create 1000 mock sessions
            for (let i = 0; i < 1000; i++) {
                largeSessions.push({
                    sessionId: `session-${i}`,
                    userId: mockUserId,
                    agentId: 'friendly-tutor',
                    startTime: new Date(),
                    topic: 'performance-test',
                    difficulty: 'medium',
                    messages: [],
                    performanceMetrics: {
                        duration: 1200,
                        wordsSpoken: 100,
                        grammarAccuracy: Math.random(),
                        fluencyScore: Math.random(),
                        vocabularyUsed: [`word${i}`],
                        errorsCount: Math.floor(Math.random() * 5),
                        improvementsShown: Math.floor(Math.random() * 3),
                        averageResponseTime: Math.random() * 3
                    },
                    feedbackProvided: [],
                    status: 'completed'
                });
            }
            // Should handle large dataset without memory issues
            await expect(analyticsService.calculateProgressMetrics(largeSessions)).resolves.toBeDefined();
        });
    });
});
