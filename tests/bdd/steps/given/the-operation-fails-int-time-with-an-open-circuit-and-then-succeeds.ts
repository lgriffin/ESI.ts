import { CircuitOpenError } from '../../../../src/core/circuitBreaker/CircuitBreaker';
import { Given } from '../../support/steps';

Given(
  'the operation fails {int} time with an open circuit and then succeeds',
  function (times: number) {
    this.values.attempts = 0;
    this.values.operation = (): Promise<string> => {
      this.values.attempts += 1;
      if (this.values.attempts <= times)
        return Promise.reject(
          new CircuitOpenError('/characters/1/wallet/', 5, 30_000),
        );
      return Promise.resolve('ok');
    };
  },
);
