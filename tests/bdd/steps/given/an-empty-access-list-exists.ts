import {
  ACCESS_LIST_OWNER_ID,
  EMPTY_ACCESS_LIST_ID,
  accessListFixtures,
  accessListPaths,
} from '../../support/access-lists';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an empty access list exists', function () {
  queueResponse({
    match: accessListPaths.list(ACCESS_LIST_OWNER_ID, EMPTY_ACCESS_LIST_ID),
    body: accessListFixtures.emptyList(),
  });
});
