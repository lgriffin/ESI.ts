import { IRateLimiter, RateLimitGroupStatus } from './IRateLimiter';
import {
  esiRateLimitGroups,
  RateLimitGroupSpec,
} from '../endpoints/esi-rate-limit-groups.generated';
import { camelToSnake } from '../util/stringUtil';
import { logWarn } from '../logger/loggerUtil';
import { sleep } from '../util/sleep';
import { EsiError } from '../util/error';

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  used: number;
  group: string | null;
  errorLimitRemain: number;
  errorLimitReset: number;
  retryAfter: number | null;
  blockedUntil: number;
}

function getTokenCost(statusCode: number): number {
  if (statusCode >= 200 && statusCode < 300) return 2;
  if (statusCode >= 300 && statusCode < 400) return 1;
  if (statusCode >= 400 && statusCode < 500) return 5;
  if (statusCode >= 500 && statusCode < 600) return 0;
  return 2;
}

export interface RateLimitEndpointOverride {
  maxTokens: number;
  windowSizeMs: number;
}

export interface RateLimiterConfig {
  minDelayMs?: number;
  decelerationThreshold?: number;
  userKeyExtractor?: (headers: Record<string, string>) => string;
  endpointOverrides?: Record<string, RateLimitEndpointOverride>;
}

interface GroupBucket {
  group: string;
  remaining: number;
  limit: number;
  used: number;
  windowSizeMs: number;
  blockedUntil: number;
  lastUpdated: number;
}

interface ErrorLimitState {
  remain: number;
  reset: number;
}

interface UserBucketSet {
  groups: Map<string, GroupBucket>;
  errorLimit: ErrorLimitState;
  lastAccessed: number;
}

const DEFAULT_WINDOW_MS = 900_000;
const DEFAULT_ERROR_LIMIT: ErrorLimitState = { remain: 100, reset: 0 };

export class RateLimiter implements IRateLimiter {
  private readonly minDelayMs: number;
  private readonly decelerationThreshold: number;
  private readonly userKeyExtractor?: (
    headers: Record<string, string>,
  ) => string;
  private readonly endpointOverrides: Record<string, RateLimitEndpointOverride>;

  private lastRequestTime: number = 0;
  private minDelayChain: Promise<void> = Promise.resolve();
  private isTestMode: boolean = false;

  private globalErrorLimit: ErrorLimitState = { ...DEFAULT_ERROR_LIMIT };

  private defaultBuckets: Map<string, GroupBucket> = new Map();
  private userBuckets: Map<string, UserBucketSet> | null = null;
  private fallbackBucket: GroupBucket;

  private lastCleanup: number = 0;
  private static readonly CLEANUP_INTERVAL_MS = 60_000;

  constructor(config?: RateLimiterConfig) {
    this.minDelayMs = config?.minDelayMs ?? 50;
    this.decelerationThreshold = config?.decelerationThreshold ?? 0.2;
    this.userKeyExtractor = config?.userKeyExtractor;
    this.endpointOverrides = config?.endpointOverrides ?? {};
    if (this.userKeyExtractor) {
      this.userBuckets = new Map();
    }
    this.fallbackBucket = this.createFallbackBucket();
  }

  private createFallbackBucket(): GroupBucket {
    return {
      group: '__fallback__',
      remaining: -1,
      limit: 0,
      used: 0,
      windowSizeMs: DEFAULT_WINDOW_MS,
      blockedUntil: 0,
      lastUpdated: 0,
    };
  }

  private createBucketFromSpec(spec: RateLimitGroupSpec): GroupBucket {
    return {
      group: spec.group,
      remaining: spec.maxTokens,
      limit: spec.maxTokens,
      used: 0,
      windowSizeMs: spec.windowSizeMs,
      blockedUntil: 0,
      lastUpdated: 0,
    };
  }

  private createBucketForGroup(groupName: string): GroupBucket {
    return {
      group: groupName,
      remaining: -1,
      limit: 0,
      used: 0,
      windowSizeMs: DEFAULT_WINDOW_MS,
      blockedUntil: 0,
      lastUpdated: 0,
    };
  }

  private lookupGroupSpec(
    method?: string,
    templatePath?: string,
  ): RateLimitGroupSpec | undefined {
    if (!templatePath || !method) return undefined;
    const normalized = templatePath
      .replace(/\/$/, '')
      .replace(/\{(\w+)\}/g, (_, name: string) => `{${camelToSnake(name)}}`);
    const key = `${method}:${normalized}`;

    const override = this.endpointOverrides[key];
    if (override) {
      return {
        group: `endpoint:${key}`,
        maxTokens: override.maxTokens,
        windowSizeMs: override.windowSizeMs,
      };
    }

    return esiRateLimitGroups[key];
  }

  private resolveUserSet(
    requestHeaders?: Record<string, string>,
  ): UserBucketSet | null {
    if (!this.userBuckets || !this.userKeyExtractor || !requestHeaders) {
      return null;
    }

    const userKey = this.userKeyExtractor(requestHeaders);
    let userSet = this.userBuckets.get(userKey);
    if (!userSet) {
      userSet = {
        groups: new Map(),
        errorLimit: { ...DEFAULT_ERROR_LIMIT },
        lastAccessed: Date.now(),
      };
      this.userBuckets.set(userKey, userSet);
    }
    userSet.lastAccessed = Date.now();
    return userSet;
  }

  private resolveBucketMap(
    requestHeaders?: Record<string, string>,
  ): Map<string, GroupBucket> {
    const userSet = this.resolveUserSet(requestHeaders);
    return userSet ? userSet.groups : this.defaultBuckets;
  }

  private resolveErrorLimit(
    requestHeaders?: Record<string, string>,
  ): ErrorLimitState {
    const userSet = this.resolveUserSet(requestHeaders);
    return userSet ? userSet.errorLimit : this.globalErrorLimit;
  }

  private getBucket(
    templatePath?: string,
    method?: string,
    requestHeaders?: Record<string, string>,
    groupNameOverride?: string,
  ): GroupBucket {
    const bucketMap = this.resolveBucketMap(requestHeaders);

    const spec = this.lookupGroupSpec(method, templatePath);
    const groupName = groupNameOverride ?? spec?.group;

    if (!groupName) return this.fallbackBucket;

    let bucket = bucketMap.get(groupName);
    if (!bucket) {
      bucket = spec
        ? this.createBucketFromSpec(spec)
        : this.createBucketForGroup(groupName);
      bucketMap.set(groupName, bucket);
    }
    return bucket;
  }

  private cleanupStaleUsers(): void {
    if (!this.userBuckets) return;
    const now = Date.now();
    if (now - this.lastCleanup < RateLimiter.CLEANUP_INTERVAL_MS) return;
    this.lastCleanup = now;

    for (const [userKey, userSet] of this.userBuckets) {
      if (now - userSet.lastAccessed > DEFAULT_WINDOW_MS) {
        this.userBuckets.delete(userKey);
      }
    }
  }

  updateFromResponse(
    headers: Record<string, string>,
    statusCode: number,
    templatePath?: string,
    method?: string,
    requestHeaders?: Record<string, string>,
  ): void {
    if (this.isTestMode) return;

    const responseGroup = headers['x-ratelimit-group'] || undefined;
    const bucket = this.getBucket(
      templatePath,
      method,
      requestHeaders,
      responseGroup,
    );

    if ('x-ratelimit-remaining' in headers) {
      bucket.remaining = parseInt(headers['x-ratelimit-remaining'], 10);
    }
    if ('x-ratelimit-limit' in headers) {
      bucket.limit = parseInt(headers['x-ratelimit-limit'], 10);
    }
    if ('x-ratelimit-used' in headers) {
      bucket.used = parseInt(headers['x-ratelimit-used'], 10);
    }
    bucket.lastUpdated = Date.now();

    if ('retry-after' in headers) {
      const retrySeconds = parseInt(headers['retry-after'], 10);
      bucket.blockedUntil = Date.now() + retrySeconds * 1000;
    }

    if (statusCode === 420 || statusCode === 429) {
      if (bucket.blockedUntil <= Date.now()) {
        bucket.blockedUntil = Date.now() + 60_000;
      }
    }

    const errorLimit = this.resolveErrorLimit(requestHeaders);
    if ('x-esi-error-limit-remain' in headers) {
      errorLimit.remain = parseInt(headers['x-esi-error-limit-remain'], 10);
    }
    if ('x-esi-error-limit-reset' in headers) {
      errorLimit.reset = parseInt(headers['x-esi-error-limit-reset'], 10);
    }
  }

  updateRateLimitInfo(headers: Record<string, string>): void {
    this.updateFromResponse(headers, 200);
  }

  async checkRateLimit(
    templatePath?: string,
    method?: string,
    requestHeaders?: Record<string, string>,
  ): Promise<void> {
    if (this.isTestMode) return;

    this.cleanupStaleUsers();

    // Re-check after sleeping on a block so a concurrent response that
    // re-blocked the group is respected (bounded to avoid infinite waits).
    let stillBlockedBucket: GroupBucket | undefined;
    for (let i = 0; i < 10; i++) {
      const bucket = this.getBucket(templatePath, method, requestHeaders);
      const now = Date.now();
      if (bucket.blockedUntil <= now) {
        stillBlockedBucket = undefined;
        break;
      }
      stillBlockedBucket = bucket;
      const waitedUntil = bucket.blockedUntil;
      const waitTime = waitedUntil - now;
      logWarn(
        `[ESI Rate Limit] Group '${bucket.group}' blocked for ${Math.ceil(waitTime / 1000)}s (420/429 received)`,
      );
      await sleep(waitTime);
      // Clear the block we waited for; leave intact if another response extended it
      if (bucket.blockedUntil <= waitedUntil) {
        bucket.blockedUntil = 0;
      }
    }
    // Never proceed while still blocked: if concurrent responses kept
    // re-extending blockedUntil past the retry budget above, fail fast
    // with a retryable rate-limit error rather than sending the request.
    if (stillBlockedBucket && stillBlockedBucket.blockedUntil > Date.now()) {
      const waitTime = stillBlockedBucket.blockedUntil - Date.now();
      logWarn(
        `[ESI Rate Limit] Group '${stillBlockedBucket.group}' still blocked after retry budget exhausted; aborting request instead of sending while blocked`,
      );
      throw new EsiError(
        429,
        `Rate limit group '${stillBlockedBucket.group}' still blocked for ${Math.ceil(waitTime / 1000)}s`,
      );
    }

    const errorLimit = this.resolveErrorLimit(requestHeaders);
    if (errorLimit.remain <= 10 && errorLimit.remain > 0) {
      const resetMs = errorLimit.reset * 1000;
      const delay = Math.min(resetMs, 5000);
      if (delay > 0) {
        logWarn(
          `[ESI Rate Limit] Legacy error limit low (${errorLimit.remain}), waiting ${delay}ms`,
        );
        await sleep(delay);
      }
    } else if (errorLimit.remain <= 0 && errorLimit.reset > 0) {
      const waitTime = errorLimit.reset * 1000;
      logWarn(
        `[ESI Rate Limit] Legacy error limit exhausted, waiting ${Math.ceil(waitTime / 1000)}s`,
      );
      await sleep(waitTime);
    }

    const bucket = this.getBucket(templatePath, method, requestHeaders);
    if (bucket.remaining >= 0 && bucket.limit > 0) {
      const ratio = bucket.remaining / bucket.limit;

      if (bucket.remaining <= 0) {
        logWarn(
          `[ESI Rate Limit] Group '${bucket.group}' token bucket empty, waiting 1s`,
        );
        await sleep(1000);
      } else if (ratio <= this.decelerationThreshold) {
        const extraDelay = Math.ceil(
          (1 - ratio / this.decelerationThreshold) * 1000,
        );
        await sleep(extraDelay);
      }
    }

    await this.enforceMinDelay();
  }

  /**
   * Serializes min-delay waits so concurrent callers cannot all read the same
   * lastRequestTime and fire together after sleeping.
   */
  private async enforceMinDelay(): Promise<void> {
    if (this.isTestMode) {
      this.lastRequestTime = Date.now();
      return;
    }

    const run = async (): Promise<void> => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelayMs) {
        await sleep(this.minDelayMs - timeSinceLastRequest);
      }
      this.lastRequestTime = Date.now();
    };

    const scheduled = this.minDelayChain.then(run, run);
    this.minDelayChain = scheduled.then(
      () => undefined,
      () => undefined,
    );
    await scheduled;
  }

  getStatus(): RateLimitInfo {
    let worstBucket = this.fallbackBucket;
    let worstRatio = Infinity;

    const checkBucket = (bucket: GroupBucket): void => {
      if (bucket.limit > 0) {
        const ratio = bucket.remaining / bucket.limit;
        if (ratio < worstRatio) {
          worstRatio = ratio;
          worstBucket = bucket;
        }
      }
    };

    for (const bucket of this.defaultBuckets.values()) {
      checkBucket(bucket);
    }

    if (this.userBuckets) {
      for (const userSet of this.userBuckets.values()) {
        for (const bucket of userSet.groups.values()) {
          checkBucket(bucket);
        }
      }
    }

    return {
      remaining: worstBucket.remaining,
      limit: worstBucket.limit,
      used: worstBucket.used,
      group: worstBucket.group === '__fallback__' ? null : worstBucket.group,
      errorLimitRemain: this.globalErrorLimit.remain,
      errorLimitReset: this.globalErrorLimit.reset,
      retryAfter:
        worstBucket.blockedUntil > Date.now()
          ? Math.ceil((worstBucket.blockedUntil - Date.now()) / 1000)
          : null,
      blockedUntil: worstBucket.blockedUntil,
    };
  }

  getGroupStatus(group: string): RateLimitGroupStatus | undefined {
    const bucket = this.defaultBuckets.get(group);
    if (!bucket) return undefined;
    return {
      group: bucket.group,
      remaining: bucket.remaining,
      limit: bucket.limit,
      used: bucket.used,
      windowSizeMs: bucket.windowSizeMs,
      blockedUntil: bucket.blockedUntil,
    };
  }

  getAllGroupStatuses(): Map<string, RateLimitGroupStatus> {
    const result = new Map<string, RateLimitGroupStatus>();
    for (const [name, bucket] of this.defaultBuckets) {
      result.set(name, {
        group: bucket.group,
        remaining: bucket.remaining,
        limit: bucket.limit,
        used: bucket.used,
        windowSizeMs: bucket.windowSizeMs,
        blockedUntil: bucket.blockedUntil,
      });
    }
    return result;
  }

  static getTokenCost(statusCode: number): number {
    return getTokenCost(statusCode);
  }

  isBlocked(group?: string): boolean {
    const now = Date.now();

    if (group) {
      const bucket = this.defaultBuckets.get(group);
      return bucket ? bucket.blockedUntil > now : false;
    }

    if (this.fallbackBucket.blockedUntil > now) return true;
    for (const bucket of this.defaultBuckets.values()) {
      if (bucket.blockedUntil > now) return true;
    }
    return false;
  }

  setTestMode(enabled: boolean): void {
    this.isTestMode = enabled;
  }

  reset(): void {
    this.defaultBuckets.clear();
    if (this.userBuckets) this.userBuckets.clear();
    this.fallbackBucket = this.createFallbackBucket();
    this.globalErrorLimit = { ...DEFAULT_ERROR_LIMIT };
    this.lastRequestTime = 0;
    this.minDelayChain = Promise.resolve();
    this.lastCleanup = 0;
  }
}
