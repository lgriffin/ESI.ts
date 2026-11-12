import { queueSearch, searchFixtures } from '../../support/search';
import { Given } from '../../support/steps';

Given('a broad search query', function () {
  queueSearch(searchFixtures.broad());
});
