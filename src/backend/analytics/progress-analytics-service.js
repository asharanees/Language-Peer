"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KinesisProgressAnalyticsService = void 0;
const client_kinesis_1 = require("@aws-sdk/client-kinesis");
const constants_1 = require("../../shared/constants");
class KinesisProgressAnalyticsService {
    constructor(streamName, region, bufferSize) {
        this.eventBuffer = [];
        this.bufferSize = 10;
        this.flushInterval = 30000; // 30 seconds
        this.isFlushingBuffer = false;
        this.kinesisClient = new client_kinesis_1.KinesisClient({
            region: region || process.env.AWS_REGION || 'us-east-1'
        });
        this.streamName = streamName;
        this.bufferSize = bufferSize || 10;
        // Set up periodic buffer flush
        setInterval(() => this.flushBuffer(), this.flushInterval);
    }
    /**
     * Record session start event
     */
    async recordSessionStart(userId, sessionId, sessionData) {
        const event = {
            eventType: 'session_start',
            userId,
            sessionId,
            timestamp: new Date(),
            data: {
                agentId: sessionData.agentId,
                topic: sessionData.topic,
                difficulty: sessionData.difficulty,
                userLevel: sessionData.userLevel
            }
        };
        await this.addEventToBuffer(event);
    }
    /**
     * Record session end event with metrics
     */
    async recordSessionEnd(userId, sessionId, sessionMetrics) {
        const event = {
            eventType: 'session_end',
            userId,
            sessionId,
            timestamp: new Date(),
            data: {
                duration: sessionMetrics.duration,
                wordsSpoken: sessionMetrics.wordsSpoken,
                grammarAccuracy: sessionMetrics.grammarAccuracy,
                fluencyScore: sessionMetrics.fluencyScore,
                vocabularyUsed: sessionMetrics.vocabularyUsed,
                errorsCount: sessionMetrics.errorsCount,
                improvementsShown: sessionMetrics.improvementsShown,
                averageResponseTime: sessionMetrics.averageResponseTime
            }
        };
        await this.addEventToBuffer(event);
    }
    /**
     * Record user interaction events
     */
    async recordUserInteraction(userId, interactionType, data) {
        const event = {
            eventType: 'user_interaction',
            userId,
            timestamp: new Date(),
            data: {
                interactionType,
                ...data
            }
        };
        await this.addEventToBuffer(event);
    }
    /**
     * Record progress updates
     */
    async recordProgressUpdate(userId, oldMetrics, newMetrics) {
        const event = {
            eventType: 'progress_update',
            userId,
            timestamp: new Date(),
            data: {
                oldMetrics,
                newMetrics,
                improvements: {
                    grammar: newMetrics.grammarProgress - oldMetrics.grammarProgress,
                    fluency: newMetrics.fluencyProgress - oldMetrics.fluencyProgress,
                    vocabulary: newMetrics.vocabularyGrowth - oldMetrics.vocabularyGrowth,
                    confidence: newMetrics.confidenceLevel - oldMetrics.confidenceLevel
                }
            }
        };
        await this.addEventToBuffer(event);
    }
    /**
     * Record milestone achievements
     */
    async recordMilestoneAchievement(userId, milestone) {
        const event = {
            eventType: 'milestone_achieved',
            userId,
            timestamp: new Date(),
            data: {
                milestoneId: milestone.id,
                milestoneTitle: milestone.title,
                category: milestone.category,
                achievedAt: milestone.achievedAt
            }
        };
        await this.addEventToBuffer(event);
    }
    /**
     * Generate comprehensive progress report
     */
    async generateProgressReport(userId, timeframe) {
        try {
            // In a real implementation, this would query processed analytics data
            // For now, we'll simulate the report generation
            const mockProgressMetrics = {
                overallImprovement: 0.75,
                grammarProgress: 0.8,
                fluencyProgress: 0.7,
                vocabularyGrowth: 0.65,
                confidenceLevel: 0.8,
                sessionsCompleted: 15,
                totalPracticeTime: 18000, // 5 hours
                streakDays: 7
            };
            const trends = await this.getProgressTrends(userId, ['grammar', 'fluency', 'vocabulary', 'confidence'], timeframe);
            const insights = await this.getLearningInsights(userId, []);
            const recommendations = this.generateRecommendations(mockProgressMetrics, trends, insights);
            return {
                userId,
                timeframe,
                overallProgress: mockProgressMetrics,
                trends,
                insights,
                recommendations,
                generatedAt: new Date()
            };
        }
        catch (error) {
            console.error('Error generating progress report:', error);
            throw new Error(`Failed to generate progress report: ${error}`);
        }
    }
    /**
     * Get progress trends for specific metrics
     */
    async getProgressTrends(userId, metrics, timeframe) {
        try {
            // In a real implementation, this would analyze historical data from Kinesis/analytics store
            // For now, we'll generate mock trends
            const trends = [];
            for (const metric of metrics) {
                const trend = this.generateMockTrend(metric, timeframe);
                trends.push(trend);
            }
            return trends;
        }
        catch (error) {
            console.error('Error getting progress trends:', error);
            return [];
        }
    }
    /**
     * Generate learning insights from session history
     */
    async getLearningInsights(userId, sessionHistory) {
        try {
            const insights = [];
            // Analyze session patterns
            if (sessionHistory.length > 0) {
                // Consistency insight
                const recentSessions = sessionHistory.slice(0, 7); // Last 7 sessions
                const avgGrammarScore = recentSessions.reduce((sum, s) => sum + (s.performanceMetrics?.grammarAccuracy || 0), 0) / recentSessions.length;
                if (avgGrammarScore > 0.8) {
                    insights.push({
                        type: 'strength',
                        category: 'grammar',
                        description: 'Your grammar accuracy has been consistently high across recent sessions',
                        confidence: 0.9,
                        actionable: false
                    });
                }
                else if (avgGrammarScore < 0.6) {
                    insights.push({
                        type: 'weakness',
                        category: 'grammar',
                        description: 'Grammar accuracy could use improvement',
                        confidence: 0.8,
                        actionable: true,
                        recommendation: 'Focus on grammar-specific exercises and ask for more detailed feedback'
                    });
                }
                // Engagement pattern insight
                const sessionFrequency = this.calculateSessionFrequency(sessionHistory);
                if (sessionFrequency > 0.8) {
                    insights.push({
                        type: 'pattern',
                        category: 'engagement',
                        description: 'You maintain excellent practice consistency',
                        confidence: 0.95,
                        actionable: false
                    });
                }
            }
            // Add general insights
            insights.push({
                type: 'milestone',
                category: 'fluency',
                description: 'You are approaching intermediate fluency level',
                confidence: 0.7,
                actionable: true,
                recommendation: 'Try more challenging conversation topics to accelerate progress'
            });
            return insights;
        }
        catch (error) {
            console.error('Error generating learning insights:', error);
            return [];
        }
    }
    /**
     * Calculate progress metrics from session data
     */
    async calculateProgressMetrics(sessions) {
        try {
            if (sessions.length === 0) {
                return {
                    overallImprovement: 0,
                    grammarProgress: 0,
                    fluencyProgress: 0,
                    vocabularyGrowth: 0,
                    confidenceLevel: 0.5,
                    sessionsCompleted: 0,
                    totalPracticeTime: 0,
                    streakDays: 0
                };
            }
            // Calculate averages from recent sessions
            const recentSessions = sessions.slice(0, 10); // Last 10 sessions
            const totalSessions = sessions.length;
            const totalPracticeTime = sessions.reduce((sum, s) => sum + (s.performanceMetrics?.duration || 0), 0);
            const avgGrammarAccuracy = recentSessions.reduce((sum, s) => sum + (s.performanceMetrics?.grammarAccuracy || 0), 0) / recentSessions.length;
            const avgFluencyScore = recentSessions.reduce((sum, s) => sum + (s.performanceMetrics?.fluencyScore || 0), 0) / recentSessions.length;
            // Calculate vocabulary growth (unique words used)
            const allVocabulary = new Set();
            sessions.forEach(session => {
                session.performanceMetrics?.vocabularyUsed?.forEach(word => allVocabulary.add(word));
            });
            const vocabularyGrowth = Math.min(1, allVocabulary.size / 100); // Normalize to 0-1
            // Calculate confidence level based on recent performance
            const confidenceLevel = (avgGrammarAccuracy + avgFluencyScore + vocabularyGrowth) / 3;
            // Calculate overall improvement (weighted average)
            const overallImprovement = (avgGrammarAccuracy * 0.3 +
                avgFluencyScore * 0.3 +
                vocabularyGrowth * 0.2 +
                confidenceLevel * 0.2);
            // Calculate streak (simplified)
            const streakDays = this.calculateStreakDays(sessions);
            return {
                overallImprovement,
                grammarProgress: avgGrammarAccuracy,
                fluencyProgress: avgFluencyScore,
                vocabularyGrowth,
                confidenceLevel,
                sessionsCompleted: totalSessions,
                totalPracticeTime,
                streakDays
            };
        }
        catch (error) {
            console.error('Error calculating progress metrics:', error);
            throw new Error(`Failed to calculate progress metrics: ${error}`);
        }
    }
    /**
     * Private helper methods
     */
    async addEventToBuffer(event) {
        this.eventBuffer.push(event);
        if (this.eventBuffer.length >= this.bufferSize) {
            await this.flushBuffer();
        }
    }
    async flushBuffer() {
        if (this.eventBuffer.length === 0 || this.isFlushingBuffer)
            return;
        this.isFlushingBuffer = true;
        try {
            const records = this.eventBuffer.map(event => ({
                Data: new TextEncoder().encode(JSON.stringify(event)),
                PartitionKey: event.userId
            }));
            await this.kinesisClient.send(new client_kinesis_1.PutRecordsCommand({
                StreamName: this.streamName,
                Records: records
            }));
            this.eventBuffer = [];
        }
        catch (error) {
            console.error('Error flushing analytics buffer:', error);
            // Keep events in buffer for retry
        }
        finally {
            this.isFlushingBuffer = false;
        }
    }
    generateMockTrend(metric, timeframe) {
        const now = new Date();
        const dataPoints = [];
        // Generate mock data points based on timeframe
        const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
        const baseValue = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        for (let i = days; i >= 0; i--) {
            const date = new Date(now.getTime() - i * constants_1.TIME_CONSTANTS.DAY);
            const variation = (Math.random() - 0.5) * 0.2; // ±0.1 variation
            const value = Math.max(0, Math.min(1, baseValue + variation + (days - i) * 0.01)); // Slight upward trend
            dataPoints.push({ date, value });
        }
        // Calculate trend direction
        const firstValue = dataPoints[0].value;
        const lastValue = dataPoints[dataPoints.length - 1].value;
        const changeRate = ((lastValue - firstValue) / firstValue) * 100;
        let direction = 'stable';
        if (changeRate > 5)
            direction = 'improving';
        else if (changeRate < -5)
            direction = 'declining';
        return {
            metric: metric,
            direction,
            changeRate,
            timeframe,
            dataPoints
        };
    }
    generateRecommendations(metrics, trends, insights) {
        const recommendations = [];
        // Based on metrics
        if (metrics.grammarProgress < 0.7) {
            recommendations.push('Focus on grammar exercises to improve accuracy');
        }
        if (metrics.fluencyProgress < 0.7) {
            recommendations.push('Practice speaking more frequently to build fluency');
        }
        if (metrics.vocabularyGrowth < 0.5) {
            recommendations.push('Try using more diverse vocabulary in conversations');
        }
        if (metrics.streakDays < 3) {
            recommendations.push('Aim for more consistent daily practice');
        }
        // Based on trends
        const decliningTrends = trends.filter(t => t.direction === 'declining');
        if (decliningTrends.length > 0) {
            recommendations.push(`Address declining performance in: ${decliningTrends.map(t => t.metric).join(', ')}`);
        }
        // Based on insights
        const actionableInsights = insights.filter(i => i.actionable && i.recommendation);
        actionableInsights.forEach(insight => {
            if (insight.recommendation) {
                recommendations.push(insight.recommendation);
            }
        });
        // General recommendations
        if (metrics.sessionsCompleted > 10 && metrics.overallImprovement > 0.8) {
            recommendations.push('Consider advancing to more challenging conversation topics');
        }
        return recommendations.slice(0, 5); // Limit to top 5 recommendations
    }
    calculateSessionFrequency(sessions) {
        if (sessions.length < 2)
            return 0;
        const sortedSessions = sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        const recentSessions = sortedSessions.slice(0, 7); // Last 7 sessions
        const daysCovered = new Set(recentSessions.map(s => new Date(s.startTime).toDateString())).size;
        return daysCovered / 7; // Frequency as ratio of days with sessions
    }
    calculateStreakDays(sessions) {
        if (sessions.length === 0)
            return 0;
        const sortedSessions = sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        const sessionDates = sortedSessions.map(s => new Date(s.startTime).toDateString());
        const uniqueDates = [...new Set(sessionDates)];
        let streak = 0;
        const today = new Date().toDateString();
        let currentDate = new Date();
        for (const dateStr of uniqueDates) {
            const sessionDate = new Date(dateStr);
            const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / constants_1.TIME_CONSTANTS.DAY);
            if (daysDiff === streak) {
                streak++;
                currentDate = sessionDate;
            }
            else {
                break;
            }
        }
        return streak;
    }
}
exports.KinesisProgressAnalyticsService = KinesisProgressAnalyticsService;
