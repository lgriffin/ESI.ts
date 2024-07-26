import { LoyaltyApiBuilder } from '../../../src/builders/LoyaltyApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { LoyaltyClient } from '../../../src/clients/LoyaltyClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('LoyaltyApiBuilder', () => {
    it('should build and return a LoyaltyClient instance', () => {
        const builder = new LoyaltyApiBuilder(client);
        const loyaltyClient = builder.build();

        expect(loyaltyClient).toBeInstanceOf(LoyaltyClient);
    });
});
