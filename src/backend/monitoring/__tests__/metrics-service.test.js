"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
Object.defineProperty(exports, "__esModule", { value: true });
const metrics_service_1 = require("../metrics-service");
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
// Mock AWS SDK
jest.mock('@aws-sdk/client-cloudwatch');
describe('MetricsService', () => {
    let metricsService;
    let mockCloudWatch;
    beforeEach(() => {
        mockCloudWatch = new client_cloudwatch_1.CloudWatchClient({});
        mockCloudWatch.send = jest.fn().mockResolvedValue({});
        metricsService = new metrics_service_1.MetricsService('us-east-1', 'test');
        metricsService.cloudWatch = mockCloudWatch;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('publishConversationMetrics', () => {
        test('publishes conversation started metric', async () => {
            const metrics = {
                started: 1
            };
            await metricsService.publishConversationMetrics(metrics, 'session-123');
            expect(mockCloudWatch.send).toHaveBeenCalledWith(expect.any(client_cloudwatch_1.PutMetricDataCommand));
            const call = mockCloudWatch.send.mock.calls[0][0];
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
            const metrics = {
                started: 1,
                completed: 1,
                successRate: 95.5,
                averageDuration: 120000
            };
            await metricsService.publishConversationMetrics(metrics);
            expect(mockCloudWatch.send).toHaveBeenCalledWith(expect.any(client_cloudwatch_1.PutMetricDataCommand));
            const call = mockCloudWatch.send.mock.calls[0][0];
            expect(call.input.MetricData).toHaveLength(4);
            expect(call.input.MetricData).toEqual(expect.arrayContaining([
                expect.objectContaining({ MetricName: 'Started', Value: 1, Unit: 'Count' }),
                expect.objectContaining({ MetricName: 'Completed', Value: 1, Unit: 'Count' }),
                expect.objectContaining({ MetricName: 'SuccessRate', Value: 95.5, Unit: 'Percent' }),
                expect.objectContaining({ MetricName: 'AverageDuration', Value: 120000, Unit: 'Milliseconds' })
            ]));
        });
        test('handles empty metrics gracefully', async () => {
            await metricsService.publishConversationMetrics({});
            expect(mockCloudWatch.send).not.toHaveBeenCalled();
        });
    });
    describe('publishVoiceMetrics', () => {
        test('publishes voice processing metrics', async () => {
            const metrics = {
                transcriptionRequests: 5,
                synthesisRequests: 3,
                processingLatency: 1500,
                errorRate: 2.1
            };
            await metricsService.publishVoiceMetrics(metrics, 'user-456');
            expect(mockCloudWatch.send).toHaveBeenCalledWith(expect.any(client_cloudwatch_1.PutMetricDataCommand));
            const call = mockCloudWatch.send.mock.calls[0][0];
            expect(call.input.Namespace).toBe('LanguagePeer/Voice');
            expect(call.input.MetricData).toHaveLength(4);
            expect(call.input.MetricData).toEqual(expect.arrayContaining([
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
            ]));
        });
    });
    describe('publishAgentMetrics', () => {
        test('publishes agent performance metrics', async () => {
            const metrics = {
                agentInvocations: 10,
                responseLatency: 800,
                feedbackScore: 4.2,
                contextSwitches: 2
            };
            await metricsService.publishAgentMetrics(metrics, 'friendly-tutor');
            expect(mockCloudWatch.send).toHaveBeenCalledWith(expect.any(client_cloudwatch_1.PutMetricDataCommand));
            const call = mockCloudWatch.send.mock.calls[0][0];
            expect(call.input.Namespace).toBe('LanguagePeer/Agents');
            expect(call.input.MetricData).toEqual(expect.arrayContaining([
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
            ]));
        });
    });
    describe('publishBusinessMetrics', () => {
        test('publishes custom business metrics', async () => {
            await metricsService.publishBusinessMetrics('ActiveUsers', 150, 'Count', { Region: 'us-east-1', Environment: 'test' });
            expect(mockCloudWatch.send).toHaveBeenCalledWith(expect.any(client_cloudwatch_1.PutMetricDataCommand));
            const call = mockCloudWatch.send.mock.calls[0][0];
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
            await metricsService.publishErrorMetric('ValidationError', 'Invalid user input', 'conversation-service');
            expect(mockCloudWatch.send).toHaveBeenCalledWith(expect.any(client_cloudwatch_1.PutMetricDataCommand));
            const call = mockCloudWatch.send.mock.calls[0][0];
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
            expect(consoleSpy).toHaveBeenCalledWith('[conversation-service] ValidationError: Invalid user input', expect.objectContaining({
                component: 'conversation-service',
                errorType: 'ValidationError',
                errorMessage: 'Invalid user input'
            }));
            consoleSpy.mockRestore();
        });
    });
    describe('publishPerformanceMetric', () => {
        test('publishes performance metrics for successful operations', async () => {
            await metricsService.publishPerformanceMetric('database-query', 250, true);
            expect(mockCloudWatch.send).toHaveBeenCalledWith(expect.any(client_cloudwatch_1.PutMetricDataCommand));
            const call = mockCloudWatch.send.mock.calls[0][0];
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
            const call = mockCloudWatch.send.mock.calls[0][0];
            expect(call.input.MetricData).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    Dimensions: expect.arrayContaining([
                        { Name: 'Status', Value: 'Failure' }
                    ])
                })
            ]));
        });
    });
    describe('createTimer', () => {
        test('creates timer that measures operation duration', async () => {
            const timer = metricsService.createTimer('test-operation');
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 100));
            await timer.stop(true);
            expect(mockCloudWatch.send).toHaveBeenCalledWith(expect.any(client_cloudwatch_1.PutMetricDataCommand));
            const call = mockCloudWatch.send.mock.calls[0][0];
            expect(call.input.MetricData).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    MetricName: 'OperationDuration',
                    Dimensions: expect.arrayContaining([
                        { Name: 'Operation', Value: 'test-operation' },
                        { Name: 'Status', Value: 'Success' }
                    ])
                })
            ]));
            // Duration should be approximately 100ms (with some tolerance)
            const durationMetric = call.input.MetricData?.find(m => m.MetricName === 'OperationDuration');
            expect(durationMetric?.Value).toBeGreaterThan(90);
            expect(durationMetric?.Value).toBeLessThan(200);
        });
        test('timer handles failure status', async () => {
            const timer = metricsService.createTimer('failing-operation');
            await timer.stop(false);
            const call = mockCloudWatch.send.mock.calls[0][0];
            expect(call.input.MetricData).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    Dimensions: expect.arrayContaining([
                        { Name: 'Status', Value: 'Failure' }
                    ])
                })
            ]));
        });
    });
    describe('error handling', () => {
        test('handles CloudWatch API errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            mockCloudWatch.send.mockRejectedValue(new Error('CloudWatch API error'));
            // Should not throw error
            await expect(metricsService.publishBusinessMetrics('TestMetric', 1)).resolves.not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to publish metrics:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
    describe('monitorPerformance decorator', () => {
        test('decorator automatically measures method performance', async () => {
            let TestService = (() => {
                var _a;
                let _instanceExtraInitializers = [];
                let _testMethod_decorators;
                let _failingMethod_decorators;
                return _a = class TestService {
                        constructor() {
                            this.metricsService = (__runInitializers(this, _instanceExtraInitializers), metricsService);
                        }
                        async testMethod(delay) {
                            await new Promise(resolve => setTimeout(resolve, delay));
                            return 'success';
                        }
                        async failingMethod() {
                            throw new Error('Method failed');
                        }
                    },
                    (() => {
                        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
                        _testMethod_decorators = [metricsService.monitorPerformance('test-method')];
                        _failingMethod_decorators = [metricsService.monitorPerformance('failing-method')];
                        __esDecorate(_a, null, _testMethod_decorators, { kind: "method", name: "testMethod", static: false, private: false, access: { has: obj => "testMethod" in obj, get: obj => obj.testMethod }, metadata: _metadata }, null, _instanceExtraInitializers);
                        __esDecorate(_a, null, _failingMethod_decorators, { kind: "method", name: "failingMethod", static: false, private: false, access: { has: obj => "failingMethod" in obj, get: obj => obj.failingMethod }, metadata: _metadata }, null, _instanceExtraInitializers);
                        if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
                    })(),
                    _a;
            })();
            const service = new TestService();
            // Test successful method
            const result = await service.testMethod(50);
            expect(result).toBe('success');
            // Test failing method
            await expect(service.failingMethod()).rejects.toThrow('Method failed');
            // Should have called CloudWatch twice (success and failure)
            expect(mockCloudWatch.send).toHaveBeenCalledTimes(2);
            const successCall = mockCloudWatch.send.mock.calls[0][0];
            expect(successCall.input.MetricData).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    Dimensions: expect.arrayContaining([
                        { Name: 'Operation', Value: 'test-method' },
                        { Name: 'Status', Value: 'Success' }
                    ])
                })
            ]));
            const failureCall = mockCloudWatch.send.mock.calls[1][0];
            expect(failureCall.input.MetricData).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    Dimensions: expect.arrayContaining([
                        { Name: 'Operation', Value: 'failing-method' },
                        { Name: 'Status', Value: 'Failure' }
                    ])
                })
            ]));
        });
    });
});
