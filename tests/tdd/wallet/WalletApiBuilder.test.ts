import { WalletApiBuilder } from '../../../src/builders/WalletApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { WalletClient } from '../../../src/clients/WalletClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('WalletApiBuilder', () => {
    it('should build and return a WalletClient instance', () => {
        const builder = new WalletApiBuilder(client);
        const walletClient = builder.build();

        expect(walletClient).toBeInstanceOf(WalletClient);
    });
});
