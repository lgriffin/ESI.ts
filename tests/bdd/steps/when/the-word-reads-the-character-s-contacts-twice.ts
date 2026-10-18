import {
  readContacts,
  sharingClientOf,
} from '../../support/shared-cache-store';
import { When } from '../../support/steps';

When(
  "the {word} reads the character's contacts twice",
  async function (name: string) {
    const client = sharingClientOf(this, name);
    await readContacts(client);
    this.result = await readContacts(client);
  },
);
