import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { AssetsApiBuilder } from '../../../src/builders/AssetsApiBuilder';
import { AssetsClient } from '../../../src/clients/AssetsClient';

describe('AssetsApiBuilder', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    it('should build an instance of AssetsClient', () => {
        const builder = new AssetsApiBuilder(client);
        const assetsClient = builder.build();

        expect(assetsClient).toBeInstanceOf(AssetsClient);
    });
});
