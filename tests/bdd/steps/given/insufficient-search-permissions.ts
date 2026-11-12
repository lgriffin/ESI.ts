import { searchPaths } from '../../support/search';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('insufficient search permissions', function () {
  queueError(403, 'Character does not have required role(s)', {
    match: searchPaths.search,
  });
});
