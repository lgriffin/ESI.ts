import { manager } from '../../support/token-manager';
import { Then } from '../../support/steps';

Then(
  'the storage shall hold no token for character {int}',
  async function (characterId: number) {
    expect(this.error).toBeUndefined();
    expect(await manager(this).storage.get(characterId)).toBeNull();
  },
);
