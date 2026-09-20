export interface RateLimitGroupStatus {
  group: string;
  remaining: number;
  limit: number;
  used: number;
  windowSizeMs: number;
  blockedUntil: number;
}

export interface IRateLimiter {
  checkRateLimit(
    templatePath?: string,
    method?: string,
    requestHeaders?: Record<string, string>,
  ): Promise<void>;
  updateFromResponse(
    headers: Record<string, string>,
    statusCode: number,
    templatePath?: string,
    method?: string,
    requestHeaders?: Record<string, string>,
  ): void;
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
  getGroupStatus(group: string): RateLimitGroupStatus | undefined;
  getAllGroupStatuses(): Map<string, RateLimitGroupStatus>;
  isBlocked(group?: string): boolean;
  reset(): void;
}
