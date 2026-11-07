import { EsiError } from '../../../../src/core/util/error';

const WALLET = 'https://esi.evetech.net/characters/1/wallet/';
import { Given } from '../../support/steps';

Given(
  'the operation fails {int} times with status {int} and then succeeds',
  function (times: number, status: number) {
    this.values.attempts = 0;
    this.values.operation = (): Promise<string> => {
      this.values.attempts += 1;
      if (this.values.attempts <= times)
        return Promise.reject(new EsiError(status, 'failed', WALLET));
      return Promise.resolve('ok');
    };
  },
);
