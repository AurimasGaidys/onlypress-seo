/**
 * Enhanced error logging and monitoring system for AI text editing system
 * Provides structured logging, error tracking, and performance monitoring
 */

interface ErrorContext {
  endpoint: string;
  userId?: string;
  operation?: string;
  inputLength?: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceMetric {
  endpoint: string;
  operation: string;
  duration: number;
  success: boolean;
  inputLength?: number;
  outputLength?: number;
}

class ErrorLogger {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Log an error with full context
   */
  logError(error: Error | string, context: ErrorContext): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: errorMessage,
      stack: errorStack,
      context,
    };

    // In production, send to logging service
    console.error(JSON.stringify(logEntry, null, 2));

    // TODO: Send to monitoring service (DataDog, Sentry, etc.)
    // this.sendToMonitoringService(logEntry);
  }

  /**
   * Log a warning with context
   */
  logWarning(message: string, context: ErrorContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARNING',
      message,
      context,
    };

    console.warn(JSON.stringify(logEntry, null, 2));
  }

  /**
   * Log successful operation with performance metrics
   */
  logSuccess(metric: Omit<PerformanceMetric, 'success'>): void {
    const fullMetric: PerformanceMetric = { ...metric, success: true };
    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: 'Operation completed successfully',
      metric: fullMetric,
    };

    console.info(JSON.stringify(logEntry, null, 2));
  }

  /**
   * Log failed operation with performance metrics
   */
  logFailure(metric: Omit<PerformanceMetric, 'success'>): void {
    const fullMetric: PerformanceMetric = { ...metric, success: false };
    this.metrics.push(fullMetric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Operation failed',
      metric: fullMetric,
    };

    console.error(JSON.stringify(logEntry, null, 2));
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalRequests: number;
    successRate: number;
    averageDuration: number;
    medianDuration: number;
    p95Duration: number;
    endpointStats: Record<string, {
      count: number;
      successRate: number;
      avgDuration: number;
    }>;
  } {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageDuration: 0,
        medianDuration: 0,
        p95Duration: 0,
        endpointStats: {},
      };
    }

    const totalRequests = this.metrics.length;
    const successfulRequests = this.metrics.filter(m => m.success).length;
    const successRate = successfulRequests / totalRequests;

    const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b);
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const medianDuration = durations[Math.floor(durations.length / 2)];
    const p95Duration = durations[Math.floor(durations.length * 0.95)];

    // Group by endpoint
    const endpointStats: Record<string, { count: number; successCount: number; totalDuration: number }> = {};

    this.metrics.forEach(metric => {
      if (!endpointStats[metric.endpoint]) {
        endpointStats[metric.endpoint] = { count: 0, successCount: 0, totalDuration: 0 };
      }
      endpointStats[metric.endpoint].count++;
      if (metric.success) endpointStats[metric.endpoint].successCount++;
      endpointStats[metric.endpoint].totalDuration += metric.duration;
    });

    const computedEndpointStats: Record<string, { count: number; successRate: number; avgDuration: number }> = {};
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      computedEndpointStats[endpoint] = {
        count: stats.count,
        successRate: stats.successCount / stats.count,
        avgDuration: stats.totalDuration / stats.count,
      };
    });

    return {
      totalRequests,
      successRate,
      averageDuration,
      medianDuration,
      p95Duration,
      endpointStats: computedEndpointStats,
    };
  }

  /**
   * Create a performance timer
   */
  startTimer(endpoint: string, operation: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.logSuccess({ endpoint, operation, duration });
    };
  }

  /**
   * Create a timer that also tracks input/output sizes
   */
  startDetailedTimer(
    endpoint: string,
    operation: string,
    inputLength?: number
  ): {
    complete: (success: boolean, outputLength?: number) => void;
    fail: (outputLength?: number) => void;
    success: (outputLength?: number) => void;
  } {
    const startTime = Date.now();

    return {
      complete: (success: boolean, outputLength?: number) => {
        const duration = Date.now() - startTime;
        const metric = {
          endpoint,
          operation,
          duration,
          inputLength,
          outputLength,
        };

        if (success) {
          this.logSuccess(metric);
        } else {
          this.logFailure(metric);
        }
      },
      fail: (outputLength?: number) => {
        const duration = Date.now() - startTime;
        this.logFailure({
          endpoint,
          operation,
          duration,
          inputLength,
          outputLength,
        });
      },
      success: (outputLength?: number) => {
        const duration = Date.now() - startTime;
        this.logSuccess({
          endpoint,
          operation,
          duration,
          inputLength,
          outputLength,
        });
      },
    };
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

/**
 * Create a safe wrapper that automatically logs errors
 */
export function withErrorLogging<TArgs extends readonly unknown[], R>(
  fn: (...args: TArgs) => Promise<R>,
  context: ErrorContext
): (...args: TArgs) => Promise<R> {
  return async (...args: TArgs): Promise<R> => {
    try {
      const timer = errorLogger.startDetailedTimer(context.endpoint, context.operation || 'unknown');
      const result = await fn(...args);
      timer.success();
      return result;
    } catch (error) {
      errorLogger.logError(error as Error, context);
      throw error; // Re-throw to maintain original error handling
    }
  };
}

/**
 * Sanitize error messages for client responses
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal implementation details
    if (error.message.includes('GOOGLE_API_KEY')) {
      return 'AI service configuration error';
    }
    if (error.message.includes('rate limit')) {
      return 'Request rate limit exceeded. Please try again later.';
    }
    // For other errors, provide a generic message
    return 'An unexpected error occurred. Please try again.';
  }
  return 'An unexpected error occurred.';
}
