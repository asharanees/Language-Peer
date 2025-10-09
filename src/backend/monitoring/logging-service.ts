export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  operation?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class LoggingService {
  private environment: string;
  private serviceName: string;
  private minLogLevel: LogLevel;

  constructor(serviceName: string = 'LanguagePeer', environment: string = 'development') {
    this.serviceName = serviceName;
    this.environment = environment;
    this.minLogLevel = this.getMinLogLevel(environment);
  }

  private getMinLogLevel(environment: string): LogLevel {
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

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLogLevel);
  }

  private formatLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const logEntry: LogEntry = {
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

  private writeLog(logEntry: LogEntry): void {
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

  debug(message: string, context?: LogContext): void {
    const logEntry = this.formatLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog(logEntry);
  }

  info(message: string, context?: LogContext): void {
    const logEntry = this.formatLogEntry(LogLevel.INFO, message, context);
    this.writeLog(logEntry);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    const logEntry = this.formatLogEntry(LogLevel.WARN, message, context, error);
    this.writeLog(logEntry);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    const logEntry = this.formatLogEntry(LogLevel.ERROR, message, context, error);
    this.writeLog(logEntry);
  }

  /**
   * Log conversation events
   */
  logConversationEvent(event: string, sessionId: string, userId?: string, additionalContext?: LogContext): void {
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
  logVoiceEvent(event: string, userId?: string, audioLength?: number, additionalContext?: LogContext): void {
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
  logAgentEvent(event: string, agentType: string, sessionId?: string, additionalContext?: LogContext): void {
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
  logApiRequest(method: string, path: string, statusCode: number, duration: number, userId?: string, requestId?: string): void {
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
  logDatabaseOperation(operation: string, table: string, duration: number, success: boolean, error?: Error): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Database ${operation} on ${table} ${success ? 'succeeded' : 'failed'}`;
    
    if (success) {
      this.info(message, {
        component: 'database',
        operation,
        table,
        duration
      });
    } else {
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
  logSecurityEvent(event: string, userId?: string, ipAddress?: string, userAgent?: string, severity: 'low' | 'medium' | 'high' = 'medium'): void {
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
  logPerformanceMetric(operation: string, duration: number, success: boolean, additionalMetrics?: { [key: string]: number }): void {
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
  child(context: LogContext): LoggingService {
    const childLogger = new LoggingService(this.serviceName, this.environment);
    
    // Override the formatLogEntry method to include the child context
    const originalFormatLogEntry = childLogger.formatLogEntry.bind(childLogger);
    childLogger.formatLogEntry = (level: LogLevel, message: string, logContext?: LogContext, error?: Error) => {
      return originalFormatLogEntry(level, message, { ...context, ...logContext }, error);
    };
    
    return childLogger;
  }

  /**
   * Create a timer for logging operation duration
   */
  createTimer(operation: string, context?: LogContext): { stop: (success?: boolean, additionalContext?: LogContext) => void } {
    const startTime = Date.now();
    
    this.debug(`Starting ${operation}`, { ...context, component: 'timer' });
    
    return {
      stop: (success: boolean = true, additionalContext?: LogContext) => {
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
  logOperation(operation: string, component?: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const logger = this.logger || loggingService;
        const timer = logger.createTimer(operation, { component });
        
        try {
          const result = await method.apply(this, args);
          timer.stop(true);
          return result;
        } catch (error) {
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
  logError(error: Error, context?: LogContext, operation?: string): void {
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
  logUserAction(action: string, userId: string, sessionId?: string, metadata?: { [key: string]: any }): void {
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
  logHealthCheck(service: string, status: 'healthy' | 'unhealthy', responseTime?: number, error?: Error): void {
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

// Singleton instance
export const loggingService = new LoggingService(
  'LanguagePeer',
  process.env.ENVIRONMENT || 'development'
);