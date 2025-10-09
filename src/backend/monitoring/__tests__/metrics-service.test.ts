import { MetricsService, ConversationMetrics, VoiceMetrics, AgentMetrics } from '../metrics-service';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cloudwatch');

describe('MetricsService', () => {
  let metricsService: MetricsService;
  let mockCloudWatch: jest.Mocked<CloudWatchClient>;

  beforeEach(() => {
    mockCloudWatch = new CloudWatchClient({}) as jest.Mocked<CloudWatchClient>;
    mockCloudWatch.send = jest.fn().mockResolvedValue({});
    
    metricsService = new MetricsService('us-east-1', 'test');
    (metricsService as any).cloudWatch = mockCloudWatch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publishConversationMetrics', () => {
    test('publishes conversation started metric', async () => {
      const metrics: Partial<ConversationMetrics> = {
        started: 1
      };

      await metricsService.publishConversationMetrics(metrics, 'session-123');

      expect(mockCloudWatch.send).toHaveBeenCalledWith(
        expect.any(PutMetricDataCommand)
      );

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.Namespace).toBe('LanguagePeer/Conversations');
      expect(call.input.MetricData).toEqual([
        expect.objectContaining({
          MetricName: 'Started',
          Value: 1,
          Unit: 'Count',
          Dimensions: [{ Name: 'SessionId', Value: 'session-123' }]
        })
      ]);
    });

    test('publishes multiple conversation metrics', async () => {
      const metrics: Partial<ConversationMetrics> = {
        started: 1,
        completed: 1,
        successRate: 95.5,
        averageDuration: 120000
      };

      await metricsService.publishConversationMetrics(metrics);

      expect(mockCloudWatch.send).toHaveBeenCalledWith(
        expect.any(PutMetricDataCommand)
      );

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.MetricData).toHaveLength(4);
      expect(call.input.MetricData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ MetricName: 'Started', Value: 1, Unit: 'Count' }),
          expect.objectContaining({ MetricName: 'Completed', Value: 1, Unit: 'Count' }),
          expect.objectContaining({ MetricName: 'SuccessRate', Value: 95.5, Unit: 'Percent' }),
          expect.objectContaining({ MetricName: 'AverageDuration', Value: 120000, Unit: 'Milliseconds' })
        ])
      );
    });

    test('handles empty metrics gracefully', async () => {
      await metricsService.publishConversationMetrics({});

      expect(mockCloudWatch.send).not.toHaveBeenCalled();
    });
  });

  describe('publishVoiceMetrics', () => {
    test('publishes voice processing metrics', async () => {
      const metrics: Partial<VoiceMetrics> = {
        transcriptionRequests: 5,
        synthesisRequests: 3,
        processingLatency: 1500,
        errorRate: 2.1
      };

      await metricsService.publishVoiceMetrics(metrics, 'user-456');

      expect(mockCloudWatch.send).toHaveBeenCalledWith(
        expect.any(PutMetricDataCommand)
      );

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.Namespace).toBe('LanguagePeer/Voice');
      expect(call.input.MetricData).toHaveLength(4);
      expect(call.input.MetricData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            MetricName: 'TranscriptionRequests',
            Value: 5,
            Unit: 'Count',
            Dimensions: [{ Name: 'UserId', Value: 'user-456' }]
          }),
          expect.objectContaining({
            MetricName: 'ProcessingLatency',
            Value: 1500,
            Unit: 'Milliseconds',
            Dimensions: [{ Name: 'UserId', Value: 'user-456' }]
          })
        ])
      );
    });
  });

  describe('publishAgentMetrics', () => {
    test('publishes agent performance metrics', async () => {
      const metrics: Partial<AgentMetrics> = {
        agentInvocations: 10,
        responseLatency: 800,
        feedbackScore: 4.2,
        contextSwitches: 2
      };

      await metricsService.publishAgentMetrics(metrics, 'friendly-tutor');

      expect(mockCloudWatch.send).toHaveBeenCalledWith(
        expect.any(PutMetricDataCommand)
      );

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.Namespace).toBe('LanguagePeer/Agents');
      expect(call.input.MetricData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            MetricName: 'Invocations',
            Value: 10,
            Unit: 'Count',
            Dimensions: [{ Name: 'AgentType', Value: 'friendly-tutor' }]
          }),
          expect.objectContaining({
            MetricName: 'FeedbackScore',
            Value: 4.2,
            Unit: 'None',
            Dimensions: [{ Name: 'AgentType', Value: 'friendly-tutor' }]
          })
        ])
      );
    });
  });

  describe('publishBusinessMetrics', () => {
    test('publishes custom business metrics', async () => {
      await metricsService.publishBusinessMetrics(
        'ActiveUsers',
        150,
        'Count',
        { Region: 'us-east-1', Environment: 'test' }
      );

      expect(mockCloudWatch.send).toHaveBeenCalledWith(
        expect.any(PutMetricDataCommand)
      );

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.Namespace).toBe('LanguagePeer/Business');
      expect(call.input.MetricData).toEqual([
        expect.objectContaining({
          MetricName: 'ActiveUsers',
          Value: 150,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Region', Value: 'us-east-1' },
            { Name: 'Environment', Value: 'test' }
          ]
        })
      ]);
    });
  });

  describe('publishErrorMetric', () => {
    test('publishes error metrics with context', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await metricsService.publishErrorMetric(
        'ValidationError',
        'Invalid user input',
        'conversation-service'
      );

      expect(mockCloudWatch.send).toHaveBeenCalledWith(
        expect.any(PutMetricDataCommand)
      );

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.Namespace).toBe('LanguagePeer/Errors');
      expect(call.input.MetricData).toEqual([
        expect.objectContaining({
          MetricName: 'Errors',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ErrorType', Value: 'ValidationError' },
            { Name: 'Component', Value: 'conversation-service' }
          ]
        })
      ]);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[conversation-service] ValidationError: Invalid user input',
        expect.objectContaining({
          component: 'conversation-service',
          errorType: 'ValidationError',
          errorMessage: 'Invalid user input'
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('publishPerformanceMetric', () => {
    test('publishes performance metrics for successful operations', async () => {
      await metricsService.publishPerformanceMetric('database-query', 250, true);

      expect(mockCloudWatch.send).toHaveBeenCalledWith(
        expect.any(PutMetricDataCommand)
      );

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.Namespace).toBe('LanguagePeer/Performance');
      expect(call.input.MetricData).toEqual([
        expect.objectContaining({
          MetricName: 'OperationDuration',
          Value: 250,
          Unit: 'Milliseconds',
          Dimensions: [
            { Name: 'Operation', Value: 'database-query' },
            { Name: 'Status', Value: 'Success' }
          ]
        }),
        expect.objectContaining({
          MetricName: 'OperationCount',
          Value: 1,
          Unit: 'Count',
          Dimensions: [
            { Name: 'Operation', Value: 'database-query' },
            { Name: 'Status', Value: 'Success' }
          ]
        })
      ]);
    });

    test('publishes performance metrics for failed operations', async () => {
      await metricsService.publishPerformanceMetric('api-call', 5000, false);

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.MetricData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Dimensions: expect.arrayContaining([
              { Name: 'Status', Value: 'Failure' }
            ])
          })
        ])
      );
    });
  });

  describe('createTimer', () => {
    test('creates timer that measures operation duration', async () => {
      const timer = metricsService.createTimer('test-operation');

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));

      await timer.stop(true);

      expect(mockCloudWatch.send).toHaveBeenCalledWith(
        expect.any(PutMetricDataCommand)
      );

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.MetricData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            MetricName: 'OperationDuration',
            Dimensions: expect.arrayContaining([
              { Name: 'Operation', Value: 'test-operation' },
              { Name: 'Status', Value: 'Success' }
            ])
          })
        ])
      );

      // Duration should be approximately 100ms (with some tolerance)
      const durationMetric = call.input.MetricData?.find(m => m.MetricName === 'OperationDuration');
      expect(durationMetric?.Value).toBeGreaterThan(90);
      expect(durationMetric?.Value).toBeLessThan(200);
    });

    test('timer handles failure status', async () => {
      const timer = metricsService.createTimer('failing-operation');
      await timer.stop(false);

      const call = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(call.input.MetricData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Dimensions: expect.arrayContaining([
              { Name: 'Status', Value: 'Failure' }
            ])
          })
        ])
      );
    });
  });

  describe('error handling', () => {
    test('handles CloudWatch API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCloudWatch.send.mockRejectedValue(new Error('CloudWatch API error'));

      // Should not throw error
      await expect(
        metricsService.publishBusinessMetrics('TestMetric', 1)
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to publish metrics:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('monitorPerformance decorator', () => {
    test('decorator automatically measures method performance', async () => {
      class TestService {
        metricsService = metricsService;

        @metricsService.monitorPerformance('test-method')
        async testMethod(delay: number): Promise<string> {
          await new Promise(resolve => setTimeout(resolve, delay));
          return 'success';
        }

        @metricsService.monitorPerformance('failing-method')
        async failingMethod(): Promise<void> {
          throw new Error('Method failed');
        }
      }

      const service = new TestService();

      // Test successful method
      const result = await service.testMethod(50);
      expect(result).toBe('success');

      // Test failing method
      await expect(service.failingMethod()).rejects.toThrow('Method failed');

      // Should have called CloudWatch twice (success and failure)
      expect(mockCloudWatch.send).toHaveBeenCalledTimes(2);

      const successCall = mockCloudWatch.send.mock.calls[0][0] as PutMetricDataCommand;
      expect(successCall.input.MetricData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Dimensions: expect.arrayContaining([
              { Name: 'Operation', Value: 'test-method' },
              { Name: 'Status', Value: 'Success' }
            ])
          })
        ])
      );

      const failureCall = mockCloudWatch.send.mock.calls[1][0] as PutMetricDataCommand;
      expect(failureCall.input.MetricData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Dimensions: expect.arrayContaining([
              { Name: 'Operation', Value: 'failing-method' },
              { Name: 'Status', Value: 'Failure' }
            ])
          })
        ])
      );
    });
  });
});