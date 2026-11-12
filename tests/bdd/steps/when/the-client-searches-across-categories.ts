import {
  ALL_CATEGORIES,
  SEARCHING_CHARACTER_ID,
  searchQueries,
} from '../../support/search';
import { When } from '../../support/steps';

When('the client searches across categories', async function () {
  this.result = await this.client.search.characterSearch(
    SEARCHING_CHARACTER_ID,
    searchQueries.broad,
    ALL_CATEGORIES,
  );
});
