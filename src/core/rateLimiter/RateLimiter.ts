/**
 * Rate Limiter for ESI API calls
 * Handles EVE Online's rate limiting system with intelligent backoff
 */

export interface RateLimitInfo {
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}

export class RateLimiter {
    private static instance: RateLimiter;
    private rateLimitInfo: RateLimitInfo | null = null;
    private lastRequestTime: number = 0;
    private readonly minDelayMs: number = 100; // Minimum delay between requests
    private isTestMode: boolean = false;

    private constructor() {}

    static getInstance(): RateLimiter {
        if (!RateLimiter.instance) {
            RateLimiter.instance = new RateLimiter();
        }
        return RateLimiter.instance;
    }

    /**
     * Update rate limit information from response headers
     */
    updateRateLimitInfo(headers: Record<string, string>): void {
        // Skip rate limit updates in test mode
        if (this.isTestMode) {
            return;
        }

        const remaining = parseInt(headers['x-esi-error-limit-remain'] || '0', 10);
        const resetTime = parseInt(headers['x-esi-error-limit-reset'] || '0', 10);
        const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after'], 10) : undefined;

        this.rateLimitInfo = {
            remaining,
            resetTime,
            retryAfter
        };
    }

    /**
     * Check if we should wait before making the next request
     */
    async checkRateLimit(): Promise<void> {
        // Skip all rate limiting in test mode
        if (this.isTestMode) {
            return;
        }

        if (!this.rateLimitInfo) {
            // No rate limit info, just ensure minimum delay
            await this.enforceMinDelay();
            return;
        }

        const now = Date.now();
        
        // Check if we've hit the error limit
        if (this.rateLimitInfo.remaining <= 0) {
            const waitTime = this.calculateWaitTime();
            console.log(`Rate limit reached. Waiting ${waitTime}ms before next request...`);
            await this.sleep(waitTime);
            return;
        }

        // Check if we need to wait for reset time
        if (this.rateLimitInfo.resetTime > 0) {
            const resetTimeMs = this.rateLimitInfo.resetTime * 1000;
            const timeUntilReset = resetTimeMs - now;
            
            if (timeUntilReset > 0) {
                console.log(`Rate limit reset in ${timeUntilReset}ms. Waiting...`);
                await this.sleep(timeUntilReset);
            }
        }

        // Enforce minimum delay between requests
        await this.enforceMinDelay();
    }

    /**
     * Calculate how long to wait based on rate limit info
     */
    private calculateWaitTime(): number {
        if (!this.rateLimitInfo) return 0;

        // If we have a retry-after header, use that
        if (this.rateLimitInfo.retryAfter) {
            return this.rateLimitInfo.retryAfter * 1000;
        }

        // If we have a reset time, calculate wait until reset
        if (this.rateLimitInfo.resetTime > 0) {
            const now = Date.now();
            const resetTimeMs = this.rateLimitInfo.resetTime * 1000;
            return Math.max(0, resetTimeMs - now);
        }

        // Default exponential backoff
        return 5000; // 5 seconds
    }

    /**
     * Enforce minimum delay between requests
     */
    private async enforceMinDelay(): Promise<void> {
        // Skip delay in test mode
        if (this.isTestMode) {
            this.lastRequestTime = Date.now();
            return;
        }

        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minDelayMs) {
            const waitTime = this.minDelayMs - timeSinceLastRequest;
            await this.sleep(waitTime);
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current rate limit status
     */
    getStatus(): RateLimitInfo | null {
        return this.rateLimitInfo;
    }

    /**
     * Set test mode (disables delays)
     */
    setTestMode(enabled: boolean): void {
        this.isTestMode = enabled;
    }

    /**
     * Reset rate limiter state
     */
    reset(): void {
        this.rateLimitInfo = null;
        this.lastRequestTime = 0;
    }
}
