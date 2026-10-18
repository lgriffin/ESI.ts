import { contactsBefore } from '../../support/shared-cache-store';
import { Then } from '../../support/steps';

Then('the contacts read last shall not hold the new contact', function () {
  expect(this.result).toEqual(contactsBefore());
});
