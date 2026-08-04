import { EsiError } from './util/error';
import { CircuitOpenError } from './circuitBreaker/CircuitBreaker';
import { RetryConfig, retryDelay } from './util/retry';
import { sleep } from './util/sleep';
import { logInfo, logWarn, logError } from './logger/loggerUtil';
import { buildError } from './util/error';

export interface RetryContext {
  endpoint: string;
  method: string;
  requiresAuth: boolean;
  refreshToken?: () => Promise<void>;
  /** @deprecated Unused — after refresh the strategy re-enters the main operation loop. */
  retryOperation?: () => Promise<unknown>;
}

export class RetryStrategy {
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly retryMutations: boolean;

  constructor(config?: RetryConfig) {
    this.maxRetries = config?.maxRetries ?? 0;
    this.baseDelayMs = config?.baseDelayMs ?? 1000;
    this.maxDelayMs = config?.maxDelayMs ?? 30000;
    this.retryMutations = config?.retryMutations ?? false;
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: RetryContext,
  ): Promise<T> {
    const canRetryMethod = context.method === 'GET' || this.retryMutations;

    let lastError: unknown;
    let refreshAttempted = false;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        if (error instanceof CircuitOpenError) {
          throw error;
        }

        if (
          !refreshAttempted &&
          error instanceof EsiError &&
          error.statusCode === 401 &&
          context.requiresAuth &&
          context.refreshToken
        ) {
          refreshAttempted = true;
          logInfo('Received 401, attempting token refresh...');
          try {
            await context.refreshToken();
          } catch (refreshError: unknown) {
            if (
              refreshError instanceof EsiError ||
              refreshError instanceof CircuitOpenError
            ) {
              throw refreshError;
            }
            const msg =
              refreshError instanceof Error
                ? refreshError.message
                : String(refreshError);
            logError(`Token refresh failed: ${msg}`);
            throw buildError(
              `Token refresh failed: ${msg}`,
              'TOKEN_REFRESH_FAILED',
            );
          }
          logInfo('Token refreshed, retrying request');
          // Re-enter the loop so post-refresh failures use normal retry/error handling
          // (and are never mislabeled as TOKEN_REFRESH_FAILED).
          attempt--;
          continue;
        }

        if (
          error instanceof EsiError &&
          error.retryable &&
          canRetryMethod &&
          attempt < this.maxRetries
        ) {
          const delay = retryDelay(attempt, this.baseDelayMs, this.maxDelayMs);
          logWarn(
            `Request to ${context.endpoint} failed (${error.statusCode}), retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${this.maxRetries})`,
          );
          await sleep(delay);
          lastError = error;
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }
}
