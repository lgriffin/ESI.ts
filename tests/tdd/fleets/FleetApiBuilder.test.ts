import { FleetApiBuilder } from '../../../src/builders/FleetApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { FleetClient } from '../../../src/clients/FleetClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('FleetApiBuilder', () => {
    it('should build and return a FleetClient instance', () => {
        const builder = new FleetApiBuilder(client);
        const fleetClient = builder.build();

        expect(fleetClient).toBeInstanceOf(FleetClient);
    });
});
