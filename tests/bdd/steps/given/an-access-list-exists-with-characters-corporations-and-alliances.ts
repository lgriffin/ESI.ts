import {
  ACCESS_LIST_OWNER_ID,
  MIXED_ACCESS_LIST_ID,
  accessListFixtures,
  accessListPaths,
} from '../../support/access-lists';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'an access list exists with characters, corporations, and alliances',
  function () {
    queueResponse({
      match: accessListPaths.list(ACCESS_LIST_OWNER_ID, MIXED_ACCESS_LIST_ID),
      body: accessListFixtures.mixedList(),
    });
  },
);
