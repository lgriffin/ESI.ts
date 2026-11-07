import type { ApiClient } from '../../../../src/core/ApiClient';
import type { RetryStrategy } from '../../../../src/core/RetryStrategy';
import { When } from '../../support/steps';

When(
  'the retry strategy runs the operation for an authenticated GET',
  async function () {
    const strategy = this.values.strategy as RetryStrategy;
    try {
      this.result = await strategy.execute(
        this.values.operation as () => Promise<string>,
        {
          client: this.values.retryClient as ApiClient,
          endpoint: '/characters/1/wallet/',
          method: 'GET',
          requiresAuth: true,
          refreshToken: this.values.refresh as () => Promise<void>,
        },
      );
    } catch (error: unknown) {
      this.error = error;
    }
  },
);
