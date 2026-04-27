export interface IRateLimiter {
  checkRateLimit(): Promise<void>;
  updateFromResponse(headers: Record<string, string>, statusCode: number): void;
  getStatus(): {
    remaining: number;
    limit: number;
    used: number;
    group: string | null;
    errorLimitRemain: number;
    errorLimitReset: number;
    retryAfter: number | null;
    blockedUntil: number;
  };
  isBlocked(): boolean;
  reset(): void;
}
