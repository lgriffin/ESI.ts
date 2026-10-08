import type { ApiClient } from './ApiClient';

export interface RetryContext {
  client?: ApiClient | undefined;
  endpoint: string;
  method: string;
  requiresAuth: boolean;
  refreshToken?: (() => Promise<void>) | undefined;
  /** @deprecated Unused — after refresh the strategy re-enters the main operation loop. */
  retryOperation?: (() => Promise<unknown>) | undefined;
}

export interface IRetryStrategy {
  execute<T>(operation: () => Promise<T>, context: RetryContext): Promise<T>;
}
