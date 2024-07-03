import { StatusAPIBuilder } from '../../../src/api/status/StatusAPIBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('StatusAPIBuilder', () => {
    it('should build and return a StatusClient instance', () => {
        const builder = new StatusAPIBuilder(client);
        const statusClient = builder.build();

        expect(statusClient).toBeInstanceOf(statusClient);
    });
});