import { queueSearch, searchFixtures } from '../../support/search';
import { Given } from '../../support/steps';

Given('a search query with no matches', function () {
  queueSearch(searchFixtures.nothing());
});
