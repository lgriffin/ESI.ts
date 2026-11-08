import { captureOutcome } from '../../support/outcome';
import { CHARACTER_ID } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'the character view deletes the contacts {int} and {int}',
  async function (first: number, second: number) {
    await captureOutcome(this, () =>
      this.views.character!.character(CHARACTER_ID).contacts.delete({
        contact_ids: [first, second],
      }),
    );
  },
);
