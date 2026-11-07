import { When } from '../../support/steps';

When(
  'the client requests the public information of a character ID that is {word}',
  async function (value: string) {
    const id = value === 'null' ? null : undefined;
    try {
      // A caller passing an unchecked value where the type says number.
      await this.client.characters.getCharacterPublicInfo(
        id as unknown as number,
      );
    } catch (err) {
      this.error = err;
    }
  },
);
