import {
  ALL_CATEGORIES,
  SEARCHING_CHARACTER_ID,
  searchQueries,
} from '../../support/search';
import { When } from '../../support/steps';

When('the client searches for nonexistent items', async function () {
  this.result = await this.client.search.characterSearch(
    SEARCHING_CHARACTER_ID,
    searchQueries.nothing,
    ALL_CATEGORIES,
  );
});
