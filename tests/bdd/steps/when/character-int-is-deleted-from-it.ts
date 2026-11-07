import { When } from '../../support/steps';

When(
  'character {int} is deleted from it',
  async function (characterId: number) {
    await this.values.fileStorage.delete(characterId);
  },
);
