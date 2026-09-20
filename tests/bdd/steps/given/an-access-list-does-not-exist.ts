import {
  ACCESS_LIST_OWNER_ID,
  UNKNOWN_ACCESS_LIST_ID,
  accessListPaths,
} from '../../support/access-lists';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an access list does not exist', function () {
  queueError(404, 'Access list not found', {
    match: accessListPaths.list(ACCESS_LIST_OWNER_ID, UNKNOWN_ACCESS_LIST_ID),
  });
});
