import { EsiTokenRefreshError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then('the retry shall have failed with an EsiTokenRefreshError', function () {
  expect(this.error).toBeInstanceOf(EsiTokenRefreshError);
});
