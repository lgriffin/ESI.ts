import { type ManualClock, suppliedOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When('the supplied clock advances {int} seconds', function (seconds: number) {
  suppliedOf<ManualClock>(this, 'clock').advance(seconds * 1000);
});
