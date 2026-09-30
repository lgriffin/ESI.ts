import { When } from '../../support/steps';

When(
  'the client requests the public information of a character whose ID is Infinity',
  async function () {
    try {
      await this.client.characters.getCharacterPublicInfo(
        Number.POSITIVE_INFINITY,
      );
    } catch (err) {
      this.error = err;
    }
  },
);
