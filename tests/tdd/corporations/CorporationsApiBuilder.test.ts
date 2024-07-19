import { CorporationsApiBuilder } from '../../../src/builders/CorporationsApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { CorporationsClient } from '../../../src/clients/CorporationsClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('CorporationsApiBuilder', () => {
    it('should build and return a CorporationsClient instance', () => {
        const builder = new CorporationsApiBuilder(client);
        const corporationsClient = builder.build();

        expect(corporationsClient).toBeInstanceOf(CorporationsClient);
    });
});
