import {
  ACCESS_LIST_OWNER_ID,
  MIXED_ACCESS_LIST_ID,
} from '../../support/access-lists';
import { When } from '../../support/steps';

When('the client requests an access list with that token', async function () {
  try {
    await this.client.accessLists.getAccessList(
      ACCESS_LIST_OWNER_ID,
      MIXED_ACCESS_LIST_ID,
    );
  } catch (e) {
    this.error = e;
  }
});
