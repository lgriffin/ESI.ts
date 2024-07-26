import { PiApiBuilder } from '../../../src/builders/PiApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { PIClient } from '../../../src/clients/PiClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('PIClientBuilder', () => {
    it('should build and return a PIClient instance', () => {
        const builder = new PiApiBuilder(client);
        const piClient = builder.build();

        expect(piClient).toBeInstanceOf(PIClient);
    });
});
