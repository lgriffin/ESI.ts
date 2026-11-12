import { queueSearch, searchFixtures } from '../../support/search';
import { Given } from '../../support/steps';

Given('a search for a solar system name', function () {
  queueSearch(searchFixtures.solarSystems());
});
