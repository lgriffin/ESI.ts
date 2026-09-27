import {
  CHARACTER_ID,
  managedCharacter,
  runtimeOf,
} from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given('a view for a character whose managed token is stale', async function () {
  // Inside the manager's one-minute refresh skew, so getToken refreshes first.
  const { manager, accessToken } = await managedCharacter(CHARACTER_ID, {
    expiresInSeconds: 30,
  });
  this.values.storedToken = accessToken;
  this.views.character = runtimeOf(this).as(manager.identity(CHARACTER_ID));
});
