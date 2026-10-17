import { ManualClock } from '../../support/shared-runtime';
import { createSeamClient } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a client with a supplied clock', function () {
  const clock = new ManualClock();
  this.values.clock = clock;
  this.client = createSeamClient({ clock });
});
