/**
 * Rate limiter for AI API calls to prevent abuse and manage costs
 * Implements token bucket algorithm with configurable limits
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  burstLimit?: number;
}

class RateLimiter {
  private buckets = new Map<string, Bucket>();

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if request is allowed based on rate limits
   * @param key Unique identifier (e.g., user ID, IP address)
   * @returns true if request is allowed, false if rate limited
   */
  checkLimit(key: string): boolean {
    const bucket = this.getOrCreateBucket(key);
    const now = Date.now();

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const refillAmount = (timePassed / this.config.windowMs) * this.config.maxRequests;
    bucket.tokens = Math.min(this.config.maxRequests, bucket.tokens + refillAmount);
    bucket.lastRefill = now;

    // Check if we have tokens available
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for a key
   * @param key Unique identifier
   * @returns remaining requests
   */
  getRemainingRequests(key: string): number {
    const bucket = this.getOrCreateBucket(key);
    return Math.floor(bucket.tokens);
  }

  /**
   * Reset rate limit for a key (admin function)
   * @param key Unique identifier
   */
  resetLimit(key: string): void {
    this.buckets.delete(key);
  }

  private getOrCreateBucket(key: string): Bucket {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = {
        tokens: this.config.maxRequests,
        lastRefill: Date.now(),
      };
      this.buckets.set(key, bucket);
      this.scheduleCleanup(key);
    }
    return bucket;
  }

  private scheduleCleanup(key: string): void {
    // Clean up inactive buckets after 2x window time
    const cleanupTime = this.config.windowMs * 2;
    setTimeout(() => {
      this.buckets.delete(key);
    }, cleanupTime).unref(); // Don't block process exit
  }
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

// Global rate limiters for different API endpoints
export const rateLimiters = {
  // Contextual editing - more frequent for interactive editing
  contextualEdit: new RateLimiter({
    maxRequests: 60, // 60 requests per minute
    windowMs: 60000,
  }),

  // Chat assistant - slightly lower rate for conversational AI
  chatAssistant: new RateLimiter({
    maxRequests: 30, // 30 requests per minute
    windowMs: 60000,
  }),

  // Article generation - highest rate since these are premium features
  generateArticle: new RateLimiter({
    maxRequests: 10, // 10 requests per minute
    windowMs: 60000,
  }),

  // Content analysis - moderate rate
  contentAnalysis: new RateLimiter({
    maxRequests: 20, // 20 requests per minute
    windowMs: 60000,
  }),

  // Generate keywords - moderate rate
  generateKeywords: new RateLimiter({
    maxRequests: 15, // 15 requests per minute
    windowMs: 60000,
  }),

  // Generate meta - moderate rate
  generateMeta: new RateLimiter({
    maxRequests: 15, // 15 requests per minute
    windowMs: 60000,
  }),

  // Generate titles - moderate rate
  generateTitles: new RateLimiter({
    maxRequests: 15, // 15 requests per minute
    windowMs: 60000,
  }),

  // Publish - lower rate for critical operations
  publish: new RateLimiter({
    maxRequests: 5, // 5 requests per minute
    windowMs: 60000,
  }),

  // Regenerate article - moderate rate
  regenerateArticle: new RateLimiter({
    maxRequests: 10, // 10 requests per minute
    windowMs: 60000,
  }),

  // Clear chat - higher rate for UI operations
  clearChat: new RateLimiter({
    maxRequests: 30, // 30 requests per minute
    windowMs: 60000,
  }),

  // SEO analyze - moderate rate
  seoAnalyze: new RateLimiter({
    maxRequests: 20, // 20 requests per minute
    windowMs: 60000,
  }),

  // SEO optimize - lower rate for intensive operations
  seoOptimize: new RateLimiter({
    maxRequests: 10, // 10 requests per minute
    windowMs: 60000,
  }),

  // Check compatibility - moderate rate
  checkCompatibility: new RateLimiter({
    maxRequests: 20, // 20 requests per minute
    windowMs: 60000,
  }),

  // God mode operations - moderate rate
  godMode: new RateLimiter({
    maxRequests: 15, // 15 requests per minute
    windowMs: 60000,
  }),
};

/**
 * Check if API request is allowed with rate limiting
 * @param endpoint API endpoint name
 * @param userIdOrIp User ID or IP address for rate limiting
 * @returns object with allow status and remaining requests
 */
export function checkRateLimit(
  endpoint: keyof typeof rateLimiters,
  userIdOrIp: string
): { allowed: boolean; remaining: number } {
  const limiter = rateLimiters[endpoint];
  const allowed = limiter.checkLimit(userIdOrIp);
  const remaining = limiter.getRemainingRequests(userIdOrIp);

  // Log rate limit violations for monitoring
  if (!allowed) {
    console.warn(`Rate limit exceeded for ${endpoint} by ${userIdOrIp}. Remaining: ${remaining}`);
  }

  return { allowed, remaining };
}

/**
 * Rate limit error response
 */
export function createRateLimitResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please wait a moment before trying again.',
      retryAfter: 60, // seconds
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'X-RateLimit-Limit': '60', // requests per minute
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}
