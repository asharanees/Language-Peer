"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsService = exports.MetricsService = void 0;
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
class MetricsService {
    constructor(region = 'us-east-1', environment = 'development') {
        this.cloudWatch = new client_cloudwatch_1.CloudWatchClient({ region });
        this.namespace = 'LanguagePeer';
    }
    /**
     * Publish conversation metrics to CloudWatch
     */
    async publishConversationMetrics(metrics, sessionId) {
        const metricData = [];
        if (metrics.started !== undefined) {
            metricData.push({
                MetricName: 'Started',
                Value: metrics.started,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: sessionId ? [
                    { Name: 'SessionId', Value: sessionId }
                ] : undefined
            });
        }
        if (metrics.completed !== undefined) {
            metricData.push({
                MetricName: 'Completed',
                Value: metrics.completed,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: sessionId ? [
                    { Name: 'SessionId', Value: sessionId }
                ] : undefined
            });
        }
        if (metrics.failed !== undefined) {
            metricData.push({
                MetricName: 'Failed',
                Value: metrics.failed,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: sessionId ? [
                    { Name: 'SessionId', Value: sessionId }
                ] : undefined
            });
        }
        if (metrics.averageDuration !== undefined) {
            metricData.push({
                MetricName: 'AverageDuration',
                Value: metrics.averageDuration,
                Unit: 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: sessionId ? [
                    { Name: 'SessionId', Value: sessionId }
                ] : undefined
            });
        }
        if (metrics.successRate !== undefined) {
            metricData.push({
                MetricName: 'SuccessRate',
                Value: metrics.successRate,
                Unit: 'Percent',
                Timestamp: new Date(),
                Dimensions: sessionId ? [
                    { Name: 'SessionId', Value: sessionId }
                ] : undefined
            });
        }
        if (metricData.length > 0) {
            await this.publishMetrics('Conversations', metricData);
        }
    }
    /**
     * Publish voice processing metrics to CloudWatch
     */
    async publishVoiceMetrics(metrics, userId) {
        const metricData = [];
        if (metrics.transcriptionRequests !== undefined) {
            metricData.push({
                MetricName: 'TranscriptionRequests',
                Value: metrics.transcriptionRequests,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: userId ? [
                    { Name: 'UserId', Value: userId }
                ] : undefined
            });
        }
        if (metrics.synthesisRequests !== undefined) {
            metricData.push({
                MetricName: 'SynthesisRequests',
                Value: metrics.synthesisRequests,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: userId ? [
                    { Name: 'UserId', Value: userId }
                ] : undefined
            });
        }
        if (metrics.processingLatency !== undefined) {
            metricData.push({
                MetricName: 'ProcessingLatency',
                Value: metrics.processingLatency,
                Unit: 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: userId ? [
                    { Name: 'UserId', Value: userId }
                ] : undefined
            });
        }
        if (metrics.errorRate !== undefined) {
            metricData.push({
                MetricName: 'ErrorRate',
                Value: metrics.errorRate,
                Unit: 'Percent',
                Timestamp: new Date(),
                Dimensions: userId ? [
                    { Name: 'UserId', Value: userId }
                ] : undefined
            });
        }
        if (metricData.length > 0) {
            await this.publishMetrics('Voice', metricData);
        }
    }
    /**
     * Publish agent performance metrics to CloudWatch
     */
    async publishAgentMetrics(metrics, agentType) {
        const metricData = [];
        if (metrics.agentInvocations !== undefined) {
            metricData.push({
                MetricName: 'Invocations',
                Value: metrics.agentInvocations,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: agentType ? [
                    { Name: 'AgentType', Value: agentType }
                ] : undefined
            });
        }
        if (metrics.responseLatency !== undefined) {
            metricData.push({
                MetricName: 'ResponseLatency',
                Value: metrics.responseLatency,
                Unit: 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: agentType ? [
                    { Name: 'AgentType', Value: agentType }
                ] : undefined
            });
        }
        if (metrics.feedbackScore !== undefined) {
            metricData.push({
                MetricName: 'FeedbackScore',
                Value: metrics.feedbackScore,
                Unit: 'None',
                Timestamp: new Date(),
                Dimensions: agentType ? [
                    { Name: 'AgentType', Value: agentType }
                ] : undefined
            });
        }
        if (metrics.contextSwitches !== undefined) {
            metricData.push({
                MetricName: 'ContextSwitches',
                Value: metrics.contextSwitches,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: agentType ? [
                    { Name: 'AgentType', Value: agentType }
                ] : undefined
            });
        }
        if (metricData.length > 0) {
            await this.publishMetrics('Agents', metricData);
        }
    }
    /**
     * Publish custom business metrics
     */
    async publishBusinessMetrics(metricName, value, unit = 'Count', dimensions) {
        const metricData = [{
                MetricName: metricName,
                Value: value,
                Unit: unit,
                Timestamp: new Date(),
                Dimensions: dimensions ? Object.entries(dimensions).map(([name, value]) => ({
                    Name: name,
                    Value: value
                })) : undefined
            }];
        await this.publishMetrics('Business', metricData);
    }
    /**
     * Publish error metrics with context
     */
    async publishErrorMetric(errorType, errorMessage, component) {
        const metricData = [{
                MetricName: 'Errors',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                    { Name: 'ErrorType', Value: errorType },
                    { Name: 'Component', Value: component }
                ]
            }];
        await this.publishMetrics('Errors', metricData);
        // Also log the error for debugging
        console.error(`[${component}] ${errorType}: ${errorMessage}`, {
            timestamp: new Date().toISOString(),
            component,
            errorType,
            errorMessage
        });
    }
    /**
     * Publish performance metrics
     */
    async publishPerformanceMetric(operation, duration, success) {
        const metricData = [
            {
                MetricName: 'OperationDuration',
                Value: duration,
                Unit: 'Milliseconds',
                Timestamp: new Date(),
                Dimensions: [
                    { Name: 'Operation', Value: operation },
                    { Name: 'Status', Value: success ? 'Success' : 'Failure' }
                ]
            },
            {
                MetricName: 'OperationCount',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date(),
                Dimensions: [
                    { Name: 'Operation', Value: operation },
                    { Name: 'Status', Value: success ? 'Success' : 'Failure' }
                ]
            }
        ];
        await this.publishMetrics('Performance', metricData);
    }
    /**
     * Helper method to publish metrics to CloudWatch
     */
    async publishMetrics(category, metricData) {
        try {
            const command = new client_cloudwatch_1.PutMetricDataCommand({
                Namespace: `${this.namespace}/${category}`,
                MetricData: metricData
            });
            await this.cloudWatch.send(command);
        }
        catch (error) {
            console.error('Failed to publish metrics:', error);
            // Don't throw error to avoid breaking the main application flow
        }
    }
    /**
     * Create a timer for measuring operation duration
     */
    createTimer(operation) {
        const startTime = Date.now();
        return {
            stop: async (success = true) => {
                const duration = Date.now() - startTime;
                await this.publishPerformanceMetric(operation, duration, success);
            }
        };
    }
    /**
     * Decorator for automatic performance monitoring
     */
    monitorPerformance(operation) {
        return (target, propertyName, descriptor) => {
            const method = descriptor.value;
            descriptor.value = async function (...args) {
                const timer = this.metricsService?.createTimer(operation) || { stop: () => Promise.resolve() };
                try {
                    const result = await method.apply(this, args);
                    await timer.stop(true);
                    return result;
                }
                catch (error) {
                    await timer.stop(false);
                    throw error;
                }
            };
            return descriptor;
        };
    }
}
exports.MetricsService = MetricsService;
// Singleton instance
exports.metricsService = new MetricsService(process.env.AWS_REGION || 'us-east-1', process.env.ENVIRONMENT || 'development');
