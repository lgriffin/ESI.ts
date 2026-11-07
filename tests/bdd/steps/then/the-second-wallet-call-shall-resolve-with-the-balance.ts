import { Then } from '../../support/steps';

Then('the second wallet call shall resolve with the balance', function () {
  expect(this.values.outcomes[1]).toEqual({ ok: true, value: 1250.5 });
});
