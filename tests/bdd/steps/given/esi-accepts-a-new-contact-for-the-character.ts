import { queueContactAdded } from '../../support/shared-cache-store';
import { Given } from '../../support/steps';

Given('ESI accepts a new contact for the character', function () {
  queueContactAdded();
});
