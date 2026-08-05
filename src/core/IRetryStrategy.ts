import { RetryContext } from './RetryStrategy';

export interface IRetryStrategy {
  execute<T>(operation: () => Promise<T>, context: RetryContext): Promise<T>;
}
