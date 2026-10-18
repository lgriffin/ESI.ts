import { contactsAfter, queueContacts } from '../../support/shared-cache-store';
import { Given } from '../../support/steps';

Given(
  "ESI reports the character's contacts holding the new contact",
  function () {
    queueContacts(contactsAfter(), '"contacts-v2"');
  },
);
