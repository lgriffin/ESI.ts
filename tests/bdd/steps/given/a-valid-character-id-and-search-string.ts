import { queueSearch, searchFixtures } from '../../support/search';
import { Given } from '../../support/steps';

Given('a valid character ID and search string', function () {
  queueSearch(searchFixtures.characters());
});
