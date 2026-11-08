import { manager } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the onRefresh hook shall have received the stored token for character {int}',
  async function (characterId: number) {
    const state = manager(this);
    const stored = await state.storage.get(characterId);
    expect(stored).not.toBeNull();
    expect(state.hooks.refreshed).toEqual([stored]);
  },
);
