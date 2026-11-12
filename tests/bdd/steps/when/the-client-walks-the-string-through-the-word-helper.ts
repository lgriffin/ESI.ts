import { captureOutcome } from '../../support/outcome';
import { walkPagedCollection } from '../../support/paging-helpers';
import { When } from '../../support/steps';

When(
  'the client walks the {string} through the {word} helper',
  async function (collection: string, helper: string) {
    await captureOutcome(this, () =>
      walkPagedCollection(this.client, collection, helper),
    );
  },
);
