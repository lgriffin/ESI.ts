import { LocationApiBuilder } from '../../../src/builders/LocationApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { LocationClient } from '../../../src/clients/LocationClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('LocationApiBuilder', () => {
    it('should build and return a LocationClient instance', () => {
        const builder = new LocationApiBuilder(client);
        const locationClient = builder.build();

        expect(locationClient).toBeInstanceOf(LocationClient);
    });
});
