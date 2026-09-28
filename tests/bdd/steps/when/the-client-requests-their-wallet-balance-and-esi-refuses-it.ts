import { WALLET_CHARACTER_ID } from '../../support/wallet';
import { When } from '../../support/steps';

When(
  'the client requests their wallet balance and ESI refuses it',
  async function () {
    await expect(
      this.client.wallet.getCharacterWallet(WALLET_CHARACTER_ID),
    ).rejects.toMatchObject({ statusCode: 401 });
  },
);
