import { captureOutcome } from '../../support/outcome';
import { SEARCHING_CHARACTER_ID, searchQueries } from '../../support/search';
import { When } from '../../support/steps';

When('the client searches without permissions', async function () {
  await captureOutcome(this, () =>
    this.client.search.characterSearch(
      SEARCHING_CHARACTER_ID,
      searchQueries.forbidden,
      ['character'],
    ),
  );
});
