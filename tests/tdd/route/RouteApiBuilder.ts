import { RouteApiBuilder } from '../../../src/builders/RouteApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { RouteClient } from '../../../src/clients/RouteClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('RouteApiBuilder', () => {
    it('should build and return a RouteClient instance', () => {
        const builder = new RouteApiBuilder(client);
        const routeClient = builder.build();

        expect(routeClient).toBeInstanceOf(RouteClient);
    });
});
