/**
 * Rate Limiter for ESI API calls
 *
 * Implements both the new floating-window rate limiting system and the legacy
 * error-limit system per the official ESI documentation:
 *
 * New system (X-Ratelimit-* headers):
 *   - Floating window with token bucket per IP+route group
 *   - Token costs: 2xx = 2 tokens, 3xx = 1 token, 4xx = 5 tokens, 5xx = 0 tokens
 *   - Returns 429 when bucket is empty, with Retry-After header
 *
 * Legacy system (x-esi-error-limit-* headers):
 *   - 100 non-2xx/3xx errors per minute
 *   - Returns 420 when limit exceeded, with Retry-After header
 */

export interface RateLimitInfo {
  /** Tokens remaining in current window (new system) */
  remaining: number;
  /** Total token budget (new system) */
  limit: number;
  /** Tokens used in current window (new system) */
  used: number;
  /** Route group for this endpoint (new system) */
  group: string | null;
  /** Legacy error-limit remaining count */
  errorLimitRemain: number;
  /** Legacy error-limit seconds until reset */
  errorLimitReset: number;
  /** Retry-After value in seconds (set on 420/429) */
  retryAfter: number | null;
  /** Timestamp (ms) when we must stop sending requests */
  blockedUntil: number;
}

/** Token costs per HTTP status code range, per ESI docs */
const TOKEN_COSTS: Record<string, number> = {
  '2xx': 2,
  '3xx': 1,
  '4xx': 5,
  '5xx': 0,
};

function getTokenCost(statusCode: number): number {
  if (statusCode >= 200 && statusCode < 300) return TOKEN_COSTS['2xx'];
  if (statusCode >= 300 && statusCode < 400) return TOKEN_COSTS['3xx'];
  if (statusCode >= 400 && statusCode < 500) return TOKEN_COSTS['4xx'];
  if (statusCode >= 500 && statusCode < 600) return TOKEN_COSTS['5xx'];
  return 2; // default to 2xx cost
}

export class RateLimiter {
  private static instance: RateLimiter;
  private rateLimitInfo: RateLimitInfo;
  private lastRequestTime: number = 0;
  private readonly minDelayMs: number = 50;
  private isTestMode: boolean = false;

  /** Threshold below which we start adding delays to decelerate */
  private readonly decelerationThreshold: number = 0.2; // 20% remaining

  private constructor() {
    this.rateLimitInfo = this.defaultInfo();
  }

  private defaultInfo(): RateLimitInfo {
    return {
      remaining: -1, // -1 means "no data yet"
      limit: 0,
      used: 0,
      group: null,
      errorLimitRemain: 100,
      errorLimitReset: 0,
      retryAfter: null,
      blockedUntil: 0,
    };
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Update rate limit information from response headers and status code.
   * Must be called on EVERY response, not just 2xx.
   */
  updateFromResponse(
    headers: Record<string, string>,
    statusCode: number,
  ): void {
    if (this.isTestMode) return;

    // New rate limit headers (preferred)
    const remaining = headers['x-ratelimit-remaining'];
    const limit = headers['x-ratelimit-limit'];
    const used = headers['x-ratelimit-used'];
    const group = headers['x-ratelimit-group'] || null;

    if (remaining !== undefined) {
      this.rateLimitInfo.remaining = parseInt(remaining, 10);
    }
    if (limit !== undefined) {
      this.rateLimitInfo.limit = parseInt(limit, 10);
    }
    if (used !== undefined) {
      this.rateLimitInfo.used = parseInt(used, 10);
    }
    this.rateLimitInfo.group = group;

    // Legacy error limit headers
    const errorRemain = headers['x-esi-error-limit-remain'];
    const errorReset = headers['x-esi-error-limit-reset'];
    if (errorRemain !== undefined) {
      this.rateLimitInfo.errorLimitRemain = parseInt(errorRemain, 10);
    }
    if (errorReset !== undefined) {
      this.rateLimitInfo.errorLimitReset = parseInt(errorReset, 10);
    }

    // Retry-After (present on 420 and 429 responses)
    const retryAfter = headers['retry-after'];
    if (retryAfter !== undefined) {
      const retrySeconds = parseInt(retryAfter, 10);
      this.rateLimitInfo.retryAfter = retrySeconds;
      this.rateLimitInfo.blockedUntil = Date.now() + retrySeconds * 1000;
    }

    // Handle 420 (legacy error limited) and 429 (new rate limited)
    if (statusCode === 420 || statusCode === 429) {
      if (!this.rateLimitInfo.retryAfter) {
        // No Retry-After header — default to 60 seconds for safety
        this.rateLimitInfo.blockedUntil = Date.now() + 60_000;
      }
    }
  }

  /**
   * Legacy method — kept for backwards compatibility.
   * Prefer updateFromResponse() which also accepts status code.
   */
  updateRateLimitInfo(headers: Record<string, string>): void {
    this.updateFromResponse(headers, 200);
  }

  /**
   * Check if we should wait before making the next request.
   * Enforces hard blocks (420/429), proactive deceleration, and minimum delay.
   */
  async checkRateLimit(): Promise<void> {
    if (this.isTestMode) return;

    const now = Date.now();

    // Hard block: we received a 420/429 and must wait
    if (this.rateLimitInfo.blockedUntil > now) {
      const waitTime = this.rateLimitInfo.blockedUntil - now;
      console.warn(
        `[ESI Rate Limit] Blocked for ${Math.ceil(waitTime / 1000)}s (420/429 received)`,
      );
      await this.sleep(waitTime);
      // Clear the block after waiting
      this.rateLimitInfo.blockedUntil = 0;
      this.rateLimitInfo.retryAfter = null;
      return;
    }

    // Legacy error limit: if remaining errors are very low, slow down
    if (
      this.rateLimitInfo.errorLimitRemain <= 10 &&
      this.rateLimitInfo.errorLimitRemain > 0
    ) {
      const resetMs = this.rateLimitInfo.errorLimitReset * 1000;
      const delay = Math.min(resetMs, 5000); // cap at 5s
      if (delay > 0) {
        console.warn(
          `[ESI Rate Limit] Legacy error limit low (${this.rateLimitInfo.errorLimitRemain}), waiting ${delay}ms`,
        );
        await this.sleep(delay);
        return;
      }
    }

    // Legacy error limit: completely exhausted
    if (
      this.rateLimitInfo.errorLimitRemain <= 0 &&
      this.rateLimitInfo.errorLimitReset > 0
    ) {
      const waitTime = this.rateLimitInfo.errorLimitReset * 1000;
      console.warn(
        `[ESI Rate Limit] Legacy error limit exhausted, waiting ${Math.ceil(waitTime / 1000)}s`,
      );
      await this.sleep(waitTime);
      return;
    }

    // Proactive deceleration: if new-system remaining is known and getting low
    if (this.rateLimitInfo.remaining >= 0 && this.rateLimitInfo.limit > 0) {
      const ratio = this.rateLimitInfo.remaining / this.rateLimitInfo.limit;

      if (this.rateLimitInfo.remaining <= 0) {
        // Bucket empty — wait before next request
        console.warn('[ESI Rate Limit] Token bucket empty, waiting 1s');
        await this.sleep(1000);
        return;
      }

      if (ratio <= this.decelerationThreshold) {
        // Linearly increase delay as remaining approaches 0
        // At 20% remaining: ~50ms extra, at 1% remaining: ~1000ms extra
        const extraDelay = Math.ceil(
          (1 - ratio / this.decelerationThreshold) * 1000,
        );
        await this.sleep(extraDelay);
        return;
      }
    }

    // Minimum delay between requests
    await this.enforceMinDelay();
  }

  /**
   * Enforce minimum delay between requests
   */
  private async enforceMinDelay(): Promise<void> {
    if (this.isTestMode) {
      this.lastRequestTime = Date.now();
      return;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minDelayMs) {
      await this.sleep(this.minDelayMs - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Get current rate limit status */
  getStatus(): RateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /** Get token cost for a given status code */
  static getTokenCost(statusCode: number): number {
    return getTokenCost(statusCode);
  }

  /** Check if currently blocked (420/429 backoff active) */
  isBlocked(): boolean {
    return this.rateLimitInfo.blockedUntil > Date.now();
  }

  /** Set test mode (disables all delays) */
  setTestMode(enabled: boolean): void {
    this.isTestMode = enabled;
  }

  /** Reset rate limiter state */
  reset(): void {
    this.rateLimitInfo = this.defaultInfo();
    this.lastRequestTime = 0;
  }
}
