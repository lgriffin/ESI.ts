import { CRIMSON_FURY_SKINR_ID, cosmeticsPaths } from '../../support/cosmetics';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return the design layout and tier', function () {
  expect(lastRequest().url.pathname).toBe(
    cosmeticsPaths.skinr(CRIMSON_FURY_SKINR_ID),
  );
  expect(this.result.id).toBe('skinr-abc-123');
  expect(this.result.name).toBe('Crimson Fury');
  expect(this.result.tier.level).toBe(3);
  expect(this.result.layout.pattern_blend_mode).toBe('normal');
  expect(this.result.layout.slots).toEqual([{}]);
  expect(this.result.creator_id).toBe(90000001);
  expect(this.result.ship_type_id).toBe(587);
});
