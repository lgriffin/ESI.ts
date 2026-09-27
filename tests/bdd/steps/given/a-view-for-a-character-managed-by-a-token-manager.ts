import {
  CHARACTER_ID,
  managedCharacter,
  runtimeOf,
} from '../../support/shared-runtime';
import { Given } from '../../support/steps';

Given('a view for a character managed by a token manager', async function () {
  const { manager, accessToken } = await managedCharacter(CHARACTER_ID);
  this.values.storedToken = accessToken;
  this.views.character = runtimeOf(this).as(manager.identity(CHARACTER_ID));
});
