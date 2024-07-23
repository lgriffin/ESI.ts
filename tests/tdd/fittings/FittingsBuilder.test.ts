// tests/tdd/builders/FittingsApiBuilder.test.ts

import { FittingsApiBuilder } from '../../../src/builders/FittingsApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { FittingsClient } from '../../../src/clients/FittingsClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('FittingsApiBuilder', () => {
    it('should build and return a FittingsClient instance', () => {
        const builder = new FittingsApiBuilder(client);
        const fittingsClient = builder.build();

        expect(fittingsClient).toBeInstanceOf(FittingsClient);
    });
});
