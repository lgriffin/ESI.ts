import { contactsAfter } from '../../support/shared-cache-store';
import { Then } from '../../support/steps';

Then('the contacts read last shall hold the new contact', function () {
  expect(this.result).toEqual(contactsAfter());
});
