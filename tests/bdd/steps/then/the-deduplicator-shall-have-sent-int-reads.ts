import { Then } from '../../support/steps';

Then('the deduplicator shall have sent {int} reads', function (count: number) {
  expect(this.values.sentReads).toBe(count);
});
