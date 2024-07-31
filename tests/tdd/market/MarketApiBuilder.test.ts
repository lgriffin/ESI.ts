import { MarketApiBuilder } from '../../../src/builders/MarketApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { MarketClient } from '../../../src/clients/MarketClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('MarketApiBuilder', () => {
    it('should build and return a MarketClient instance', () => {
        const builder = new MarketApiBuilder(client);
        const marketClient = builder.build();

        expect(marketClient).toBeInstanceOf(MarketClient);
    });
});
