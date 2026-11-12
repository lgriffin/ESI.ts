import {
  ALL_CATEGORIES,
  SEARCHING_CHARACTER_ID,
  searchQueries,
} from '../../support/search';
import { When } from '../../support/steps';

When('the client searches for solar systems', async function () {
  this.result = await this.client.search.characterSearch(
    SEARCHING_CHARACTER_ID,
    searchQueries.solarSystem,
    ALL_CATEGORIES,
  );
});
