import {
  ACCESS_LIST_OWNER_ID,
  UNKNOWN_ACCESS_LIST_ID,
} from '../../support/access-lists';
import { When } from '../../support/steps';

When('the client requests a non-existent access list', async function () {
  try {
    await this.client.accessLists.getAccessList(
      ACCESS_LIST_OWNER_ID,
      UNKNOWN_ACCESS_LIST_ID,
    );
  } catch (e) {
    this.error = e;
  }
});
