import {
  readContacts,
  sharingClientOf,
} from '../../support/shared-cache-store';
import { When } from '../../support/steps';

When(
  "the {word} reads the character's contacts",
  async function (name: string) {
    this.result = await readContacts(sharingClientOf(this, name));
  },
);
