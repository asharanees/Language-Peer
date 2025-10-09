import { CloudWatchClient, PutMetricDataCommand, MetricDatum } from '@aws-sdk/client-cloudwatch';

export interface ConversationMetrics {
  started: number;
  completed: number;
  failed: number;
  averageDuration: number;
  successRate: number;
}

export interface VoiceMetrics {
  transcriptionRequests: number;
  synthesisRequests: number;
  processingLatency: number;
  errorRate: number;
}

export interface AgentMetrics {
  agentInvocations: number;
  responseLatency: number;
  feedbackScore: number;
  contextSwitches: number;
}

export class MetricsService {
  private cloudWatch: CloudWatchClient;
  private namespace: string;

  constructor(region: string = 'us-east-1', environment: string = 'development') {
    this.cloudWatch = new CloudWatchClient({ region });
    this.namespace = 'LanguagePeer';
  }

  /**
   * Publish conversation metrics to CloudWatch
   */
  async publishConversationMetrics(metrics: Partial<ConversationMetrics>, sessionId?: string): Promise<void> {
    const metricData: MetricDatum[] = [];

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
  async publishVoiceMetrics(metrics: Partial<VoiceMetrics>, userId?: string): Promise<void> {
    const metricData: MetricDatum[] = [];

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
  async publishAgentMetrics(metrics: Partial<AgentMetrics>, agentType?: string): Promise<void> {
    const metricData: MetricDatum[] = [];

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
  async publishBusinessMetrics(metricName: string, value: number, unit: string = 'Count', dimensions?: { [key: string]: string }): Promise<void> {
    const metricData: MetricDatum[] = [{
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
  async publishErrorMetric(errorType: string, errorMessage: string, component: string): Promise<void> {
    const metricData: MetricDatum[] = [{
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
  async publishPerformanceMetric(operation: string, duration: number, success: boolean): Promise<void> {
    const metricData: MetricDatum[] = [
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
  private async publishMetrics(category: string, metricData: MetricDatum[]): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: `${this.namespace}/${category}`,
        MetricData: metricData
      });

      await this.cloudWatch.send(command);
    } catch (error) {
      console.error('Failed to publish metrics:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  /**
   * Create a timer for measuring operation duration
   */
  createTimer(operation: string): { stop: (success?: boolean) => Promise<void> } {
    const startTime = Date.now();

    return {
      stop: async (success: boolean = true) => {
        const duration = Date.now() - startTime;
        await this.publishPerformanceMetric(operation, duration, success);
      }
    };
  }

  /**
   * Decorator for automatic performance monitoring
   */
  monitorPerformance(operation: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const timer = this.metricsService?.createTimer(operation) || { stop: () => Promise.resolve() };
        
        try {
          const result = await method.apply(this, args);
          await timer.stop(true);
          return result;
        } catch (error) {
          await timer.stop(false);
          throw error;
        }
      };

      return descriptor;
    };
  }
}

// Singleton instance
export const metricsService = new MetricsService(
  process.env.AWS_REGION || 'us-east-1',
  process.env.ENVIRONMENT || 'development'
);