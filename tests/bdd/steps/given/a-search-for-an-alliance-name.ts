import { queueSearch, searchFixtures } from '../../support/search';
import { Given } from '../../support/steps';

Given('a search for an alliance name', function () {
  queueSearch(searchFixtures.alliances());
});
