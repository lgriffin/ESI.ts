import { UiApiBuilder } from '../../../src/builders/UiApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { UIClient } from '../../../src/clients/UiClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('UiApiBuilder', () => {
    it('should build and return a UiClient instance', () => {
        const builder = new UiApiBuilder(client);
        const uiClient = builder.build();

        expect(uiClient).toBeInstanceOf(UIClient);
    });
});
