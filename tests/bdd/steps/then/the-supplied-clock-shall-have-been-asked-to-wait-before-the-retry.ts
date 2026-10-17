import { type ManualClock, suppliedOf } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  'the supplied clock shall have been asked to wait before the retry',
  function () {
    const waits = suppliedOf<ManualClock>(this, 'clock').waits;
    expect(waits.length).toBeGreaterThanOrEqual(1);
    expect(waits.every((ms) => ms >= 0)).toBe(true);
  },
);
