import { LOW_POWER_EFFECT_ID } from '../../support/dogma';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return complete effect information', function () {
  expect(lastRequest().url.pathname).toMatch(
    new RegExp(`/dogma/effects/${LOW_POWER_EFFECT_ID}/?$`),
  );
  expect(this.result.effect_id).toBe(LOW_POWER_EFFECT_ID);
  expect(this.result.name).toBe('lowPower');
  expect(this.result.published).toBe(true);
  expect(this.result.is_warp_safe).toBe(true);
});
