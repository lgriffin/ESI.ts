import { EsiError } from '../../../../src/core/util/error';
import { Given } from '../../support/steps';

Given('the token refresh fails with status {int}', function (status: number) {
  this.values.refresh = (): Promise<void> => {
    this.values.refreshes += 1;
    return Promise.reject(new EsiError(status, 'invalid_grant'));
  };
});
