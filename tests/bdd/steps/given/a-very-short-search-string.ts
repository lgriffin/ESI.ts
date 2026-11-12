import { queueSearch, searchFixtures } from '../../support/search';
import { Given } from '../../support/steps';

Given('a very short search string', function () {
  queueSearch(searchFixtures.short());
});
