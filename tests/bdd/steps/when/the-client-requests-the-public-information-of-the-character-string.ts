import { When } from '../../support/steps';

When(
  'the client requests the public information of the character {string}',
  async function (characterId: string) {
    try {
      // A caller passing an unchecked string where the type says number.
      await this.client.characters.getCharacterPublicInfo(
        characterId as unknown as number,
      );
    } catch (err) {
      this.error = err;
    }
  },
);
