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
const logging_service_1 = require("../logging-service");
describe('LoggingService', () => {
    let loggingService;
    let consoleSpy;
    beforeEach(() => {
        loggingService = new logging_service_1.LoggingService('TestService', 'test');
        consoleSpy = {
            log: jest.spyOn(console, 'log').mockImplementation(),
            info: jest.spyOn(console, 'info').mockImplementation(),
            warn: jest.spyOn(console, 'warn').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation()
        };
    });
    afterEach(() => {
        Object.values(consoleSpy).forEach(spy => spy.mockRestore());
    });
    describe('basic logging', () => {
        test('logs debug messages', () => {
            loggingService.debug('Debug message', { userId: 'user-123' });
            expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('"level":"DEBUG"'));
            expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('"message":"Debug message"'));
            expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('"userId":"user-123"'));
        });
        test('logs info messages', () => {
            loggingService.info('Info message');
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"level":"INFO"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"Info message"'));
        });
        test('logs warning messages with error', () => {
            const error = new Error('Test error');
            loggingService.warn('Warning message', { component: 'test' }, error);
            expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('"level":"WARN"'));
            expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('"message":"Warning message"'));
            expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('"component":"test"'));
            expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('"error":{'));
        });
        test('logs error messages', () => {
            const error = new Error('Test error');
            loggingService.error('Error message', { requestId: 'req-456' }, error);
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"level":"ERROR"'));
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"message":"Error message"'));
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"requestId":"req-456"'));
        });
    });
    describe('log level filtering', () => {
        test('production environment filters debug logs', () => {
            const prodLogger = new logging_service_1.LoggingService('TestService', 'production');
            const prodConsoleSpy = jest.spyOn(console, 'log').mockImplementation();
            prodLogger.debug('Debug message');
            expect(prodConsoleSpy).not.toHaveBeenCalled();
            prodConsoleSpy.mockRestore();
        });
        test('development environment allows all log levels', () => {
            const devLogger = new logging_service_1.LoggingService('TestService', 'development');
            const devConsoleSpy = jest.spyOn(console, 'log').mockImplementation();
            devLogger.debug('Debug message');
            expect(devConsoleSpy).toHaveBeenCalled();
            devConsoleSpy.mockRestore();
        });
        test('error logs are always shown regardless of environment', () => {
            const prodLogger = new logging_service_1.LoggingService('TestService', 'production');
            const prodConsoleSpy = jest.spyOn(console, 'error').mockImplementation();
            prodLogger.error('Error message');
            expect(prodConsoleSpy).toHaveBeenCalled();
            prodConsoleSpy.mockRestore();
        });
    });
    describe('structured logging', () => {
        test('includes service and environment in context', () => {
            loggingService.info('Test message');
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"service":"TestService"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"environment":"test"'));
        });
        test('includes timestamp in ISO format', () => {
            loggingService.info('Test message');
            const logCall = consoleSpy.info.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);
            expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
        test('properly formats error objects', () => {
            const error = new Error('Test error');
            error.stack = 'Error: Test error\n    at test.js:1:1';
            loggingService.error('Error occurred', {}, error);
            const logCall = consoleSpy.error.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);
            expect(logEntry.error).toEqual({
                name: 'Error',
                message: 'Test error',
                stack: 'Error: Test error\n    at test.js:1:1'
            });
        });
    });
    describe('specialized logging methods', () => {
        test('logConversationEvent includes conversation context', () => {
            loggingService.logConversationEvent('started', 'session-123', 'user-456', {
                agentType: 'friendly-tutor'
            });
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"Conversation started"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"sessionId":"session-123"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"userId":"user-456"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"component":"conversation"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"agentType":"friendly-tutor"'));
        });
        test('logVoiceEvent includes voice processing context', () => {
            loggingService.logVoiceEvent('transcription_completed', 'user-789', 5000);
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"Voice processing transcription_completed"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"userId":"user-789"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"audioLength":5000'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"component":"voice"'));
        });
        test('logAgentEvent includes agent context', () => {
            loggingService.logAgentEvent('response_generated', 'pronunciation-coach', 'session-456');
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"Agent response_generated"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"agentType":"pronunciation-coach"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"sessionId":"session-456"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"component":"agent"'));
        });
        test('logApiRequest includes API context', () => {
            loggingService.logApiRequest('POST', '/api/conversations', 200, 150, 'user-123', 'req-789');
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"API POST /api/conversations"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"method":"POST"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"path":"/api/conversations"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"statusCode":200'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"duration":150'));
        });
        test('logDatabaseOperation logs successful operations', () => {
            loggingService.logDatabaseOperation('query', 'users', 50, true);
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"Database query on users succeeded"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"component":"database"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"duration":50'));
        });
        test('logDatabaseOperation logs failed operations as errors', () => {
            const error = new Error('Connection timeout');
            loggingService.logDatabaseOperation('insert', 'sessions', 5000, false, error);
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"message":"Database insert on sessions failed"'));
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"component":"database"'));
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"duration":5000'));
        });
        test('logSecurityEvent uses appropriate log levels', () => {
            loggingService.logSecurityEvent('login_attempt', 'user-123', '192.168.1.1', 'Mozilla/5.0', 'low');
            expect(consoleSpy.info).toHaveBeenCalled();
            loggingService.logSecurityEvent('failed_login', 'user-456', '10.0.0.1', 'curl/7.0', 'medium');
            expect(consoleSpy.warn).toHaveBeenCalled();
            loggingService.logSecurityEvent('brute_force_detected', undefined, '192.168.1.100', 'bot', 'high');
            expect(consoleSpy.error).toHaveBeenCalled();
        });
    });
    describe('child logger', () => {
        test('creates child logger with additional context', () => {
            const childLogger = loggingService.child({ userId: 'user-123', sessionId: 'session-456' });
            childLogger.info('Child logger message');
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"userId":"user-123"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"sessionId":"session-456"'));
        });
        test('child context is merged with method context', () => {
            const childLogger = loggingService.child({ userId: 'user-123' });
            childLogger.info('Message', { requestId: 'req-789' });
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"userId":"user-123"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"requestId":"req-789"'));
        });
    });
    describe('timer functionality', () => {
        test('createTimer logs operation start and completion', () => {
            const timer = loggingService.createTimer('test-operation', { component: 'test' });
            expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('"message":"Starting test-operation"'));
            timer.stop(true, { result: 'success' });
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"test-operation completed in'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"success":true'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"result":"success"'));
        });
        test('timer logs failures as warnings', () => {
            const timer = loggingService.createTimer('failing-operation');
            timer.stop(false, { error: 'Operation failed' });
            expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('"message":"failing-operation failed in'));
            expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('"success":false'));
        });
    });
    describe('logOperation decorator', () => {
        test('decorator automatically logs method execution', async () => {
            let TestService = (() => {
                var _a;
                let _instanceExtraInitializers = [];
                let _testMethod_decorators;
                let _failingMethod_decorators;
                return _a = class TestService {
                        constructor() {
                            this.logger = (__runInitializers(this, _instanceExtraInitializers), loggingService);
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
                        _testMethod_decorators = [loggingService.logOperation('test-method', 'test-component')];
                        _failingMethod_decorators = [loggingService.logOperation('failing-method')];
                        __esDecorate(_a, null, _testMethod_decorators, { kind: "method", name: "testMethod", static: false, private: false, access: { has: obj => "testMethod" in obj, get: obj => obj.testMethod }, metadata: _metadata }, null, _instanceExtraInitializers);
                        __esDecorate(_a, null, _failingMethod_decorators, { kind: "method", name: "failingMethod", static: false, private: false, access: { has: obj => "failingMethod" in obj, get: obj => obj.failingMethod }, metadata: _metadata }, null, _instanceExtraInitializers);
                        if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
                    })(),
                    _a;
            })();
            const service = new TestService();
            // Test successful method
            const result = await service.testMethod(10);
            expect(result).toBe('success');
            // Test failing method
            await expect(service.failingMethod()).rejects.toThrow('Method failed');
            // Should have logged start and completion for successful method
            expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('"message":"Starting test-method"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"test-method completed in'));
            // Should have logged start and failure for failing method
            expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('"message":"Starting failing-method"'));
            expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('"message":"failing-method failed in'));
        });
    });
    describe('utility methods', () => {
        test('logError formats errors consistently', () => {
            const error = new Error('Test error');
            loggingService.logError(error, { userId: 'user-123' }, 'test-operation');
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"message":"Error in test-operation: Test error"'));
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"userId":"user-123"'));
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"operation":"test-operation"'));
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"errorName":"Error"'));
        });
        test('logUserAction tracks user analytics', () => {
            loggingService.logUserAction('button_click', 'user-123', 'session-456', {
                buttonId: 'start-conversation',
                page: 'home'
            });
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"User action: button_click"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"component":"user-analytics"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"buttonId":"start-conversation"'));
        });
        test('logHealthCheck tracks service health', () => {
            loggingService.logHealthCheck('database', 'healthy', 50);
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"message":"Health check: database is healthy"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"component":"health-check"'));
            expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('"responseTime":50'));
            const error = new Error('Connection failed');
            loggingService.logHealthCheck('api', 'unhealthy', 5000, error);
            expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"message":"Health check: api is unhealthy"'));
        });
    });
});
