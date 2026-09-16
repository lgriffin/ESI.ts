import {
  ACCESS_LIST_OWNER_ID,
  EMPTY_ACCESS_LIST_ID,
} from '../../support/access-lists';
import { When } from '../../support/steps';

When('the client requests the empty access list', async function () {
  this.result = await this.client.accessLists.getAccessList(
    ACCESS_LIST_OWNER_ID,
    EMPTY_ACCESS_LIST_ID,
  );
});
