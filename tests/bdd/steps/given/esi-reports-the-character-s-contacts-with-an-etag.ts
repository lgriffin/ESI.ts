import {
  contactsBefore,
  queueContacts,
} from '../../support/shared-cache-store';
import { Given } from '../../support/steps';

Given("ESI reports the character's contacts with an ETag", function () {
  queueContacts(contactsBefore(), '"contacts-v1"');
});
