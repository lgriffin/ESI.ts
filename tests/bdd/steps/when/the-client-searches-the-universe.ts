import {
  SEARCH_CATEGORIES,
  SEARCH_CHARACTER_ID,
  SEARCH_TERM,
} from '../../support/universe';
import { When } from '../../support/steps';

When('the client searches the universe', async function () {
  this.result = await this.client.search.characterSearch(
    SEARCH_CHARACTER_ID,
    SEARCH_TERM,
    [...SEARCH_CATEGORIES],
  );
});
