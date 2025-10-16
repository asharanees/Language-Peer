"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingService = exports.LoggingService = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class LoggingService {
    constructor(serviceName = 'LanguagePeer', environment = 'development') {
        this.serviceName = serviceName;
        this.environment = environment;
        this.minLogLevel = this.getMinLogLevel(environment);
    }
    getMinLogLevel(environment) {
        switch (environment) {
            case 'production':
                return LogLevel.INFO;
            case 'staging':
                return LogLevel.DEBUG;
            case 'development':
            default:
                return LogLevel.DEBUG;
        }
    }
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return levels.indexOf(level) >= levels.indexOf(this.minLogLevel);
    }
    formatLogEntry(level, message, context, error) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: {
                ...context,
                service: this.serviceName,
                environment: this.environment
            }
        };
        if (error) {
            logEntry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }
        return logEntry;
    }
    writeLog(logEntry) {
        if (!this.shouldLog(logEntry.level)) {
            return;
        }
        // In AWS Lambda, console.log writes to CloudWatch Logs
        const logString = JSON.stringify(logEntry);
        switch (logEntry.level) {
            case LogLevel.ERROR:
                console.error(logString);
                break;
            case LogLevel.WARN:
                console.warn(logString);
                break;
            case LogLevel.INFO:
                console.info(logString);
                break;
            case LogLevel.DEBUG:
            default:
                console.log(logString);
                break;
        }
    }
    debug(message, context) {
        const logEntry = this.formatLogEntry(LogLevel.DEBUG, message, context);
        this.writeLog(logEntry);
    }
    info(message, context) {
        const logEntry = this.formatLogEntry(LogLevel.INFO, message, context);
        this.writeLog(logEntry);
    }
    warn(message, context, error) {
        const logEntry = this.formatLogEntry(LogLevel.WARN, message, context, error);
        this.writeLog(logEntry);
    }
    error(message, context, error) {
        const logEntry = this.formatLogEntry(LogLevel.ERROR, message, context, error);
        this.writeLog(logEntry);
    }
    /**
     * Log conversation events
     */
    logConversationEvent(event, sessionId, userId, additionalContext) {
        this.info(`Conversation ${event}`, {
            sessionId,
            userId,
            component: 'conversation',
            operation: event,
            ...additionalContext
        });
    }
    /**
     * Log voice processing events
     */
    logVoiceEvent(event, userId, audioLength, additionalContext) {
        this.info(`Voice processing ${event}`, {
            userId,
            component: 'voice',
            operation: event,
            audioLength,
            ...additionalContext
        });
    }
    /**
     * Log agent interactions
     */
    logAgentEvent(event, agentType, sessionId, additionalContext) {
        this.info(`Agent ${event}`, {
            sessionId,
            agentType,
            component: 'agent',
            operation: event,
            ...additionalContext
        });
    }
    /**
     * Log API requests
     */
    logApiRequest(method, path, statusCode, duration, userId, requestId) {
        this.info(`API ${method} ${path}`, {
            userId,
            requestId,
            component: 'api',
            operation: 'request',
            method,
            path,
            statusCode,
            duration
        });
    }
    /**
     * Log database operations
     */
    logDatabaseOperation(operation, table, duration, success, error) {
        const level = success ? LogLevel.INFO : LogLevel.ERROR;
        const message = `Database ${operation} on ${table} ${success ? 'succeeded' : 'failed'}`;
        if (success) {
            this.info(message, {
                component: 'database',
                operation,
                table,
                duration
            });
        }
        else {
            this.error(message, {
                component: 'database',
                operation,
                table,
                duration
            }, error);
        }
    }
    /**
     * Log security events
     */
    logSecurityEvent(event, userId, ipAddress, userAgent, severity = 'medium') {
        const level = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
        const logEntry = this.formatLogEntry(level, `Security event: ${event}`, {
            userId,
            ipAddress,
            userAgent,
            component: 'security',
            operation: event,
            severity
        });
        this.writeLog(logEntry);
    }
    /**
     * Log performance metrics
     */
    logPerformanceMetric(operation, duration, success, additionalMetrics) {
        this.info(`Performance: ${operation}`, {
            component: 'performance',
            operation,
            duration,
            success,
            ...additionalMetrics
        });
    }
    /**
     * Create a child logger with additional context
     */
    child(context) {
        const childLogger = new LoggingService(this.serviceName, this.environment);
        // Override the formatLogEntry method to include the child context
        const originalFormatLogEntry = childLogger.formatLogEntry.bind(childLogger);
        childLogger.formatLogEntry = (level, message, logContext, error) => {
            return originalFormatLogEntry(level, message, { ...context, ...logContext }, error);
        };
        return childLogger;
    }
    /**
     * Create a timer for logging operation duration
     */
    createTimer(operation, context) {
        const startTime = Date.now();
        this.debug(`Starting ${operation}`, { ...context, component: 'timer' });
        return {
            stop: (success = true, additionalContext) => {
                const duration = Date.now() - startTime;
                const level = success ? LogLevel.INFO : LogLevel.WARN;
                const message = `${operation} ${success ? 'completed' : 'failed'} in ${duration}ms`;
                const logEntry = this.formatLogEntry(level, message, {
                    ...context,
                    ...additionalContext,
                    component: 'timer',
                    operation,
                    duration,
                    success
                });
                this.writeLog(logEntry);
            }
        };
    }
    /**
     * Decorator for automatic operation logging
     */
    logOperation(operation, component) {
        return (target, propertyName, descriptor) => {
            const method = descriptor.value;
            descriptor.value = async function (...args) {
                const logger = this.logger || exports.loggingService;
                const timer = logger.createTimer(operation, { component });
                try {
                    const result = await method.apply(this, args);
                    timer.stop(true);
                    return result;
                }
                catch (error) {
                    timer.stop(false, { error: error.message });
                    throw error;
                }
            };
            return descriptor;
        };
    }
    /**
     * Structured error logging with automatic error tracking
     */
    logError(error, context, operation) {
        this.error(`Error in ${operation || 'unknown operation'}: ${error.message}`, {
            ...context,
            operation,
            errorName: error.name,
            errorStack: error.stack
        }, error);
    }
    /**
     * Log user actions for analytics
     */
    logUserAction(action, userId, sessionId, metadata) {
        this.info(`User action: ${action}`, {
            userId,
            sessionId,
            component: 'user-analytics',
            operation: action,
            ...metadata
        });
    }
    /**
     * Log system health checks
     */
    logHealthCheck(service, status, responseTime, error) {
        const level = status === 'healthy' ? LogLevel.INFO : LogLevel.ERROR;
        const message = `Health check: ${service} is ${status}`;
        const logEntry = this.formatLogEntry(level, message, {
            component: 'health-check',
            service,
            status,
            responseTime
        }, error);
        this.writeLog(logEntry);
    }
}
exports.LoggingService = LoggingService;
// Singleton instance
exports.loggingService = new LoggingService('LanguagePeer', process.env.ENVIRONMENT || 'development');
