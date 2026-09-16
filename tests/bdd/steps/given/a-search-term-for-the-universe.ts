import {
  SEARCH_CHARACTER_ID,
  universeFixtures,
  universePaths,
} from '../../support/universe';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('a search term for the universe', function () {
  queueResponse({
    match: universePaths.characterSearch(SEARCH_CHARACTER_ID),
    body: universeFixtures.searchResults(),
  });
});
