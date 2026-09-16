import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall successfully retrieve all related data', function () {
  const { alliance, contacts, corporations } = this.result;
  expect(sentRequests()).toHaveLength(3);
  expect(alliance.ticker).toBe('CONDI');
  expect(contacts.map((c: any) => c.contact_id)).toEqual([2112625428]);
  expect(corporations).toEqual([1344654522, 1344654523]);
  for (const corporationId of corporations) {
    expect(typeof corporationId).toBe('number');
  }
});
