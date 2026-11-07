import { EsiParseError } from '../../../../src/core/util/error';
import { Then } from '../../support/steps';

Then('the call shall be rejected with an EsiParseError', function () {
  expect(this.error).toBeInstanceOf(EsiParseError);
});
