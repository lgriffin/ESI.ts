import { addContact, sharingClientOf } from '../../support/shared-cache-store';
import { When } from '../../support/steps';

When('the writer adds a contact for the character', async function () {
  await addContact(sharingClientOf(this, 'writer'));
});
