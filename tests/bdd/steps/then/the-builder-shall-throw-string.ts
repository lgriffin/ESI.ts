import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the builder shall throw {string}', function (message: string) {
  expect(this.error).toBeInstanceOf(Error);
  expect((this.error as Error).message).toBe(message);
  expect(sentRequests()).toHaveLength(0);
});
