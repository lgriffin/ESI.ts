import { When } from '../../support/steps';

When(
  'the client requests the public information of a character whose ID is NaN',
  async function () {
    try {
      await this.client.characters.getCharacterPublicInfo(Number.NaN);
    } catch (err) {
      this.error = err;
    }
  },
);
