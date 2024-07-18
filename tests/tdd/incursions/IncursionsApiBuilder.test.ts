import { IncursionsApiBuilder } from '../../../src/builders/IncursionsApiBuilder';
import { IncursionsClient } from '../../../src/clients/IncursionsClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

describe('IncursionsApiBuilder', () => {
    it('should build an IncursionsClient', () => {
        const config = getConfig();
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        const builder = new IncursionsApiBuilder(client);
        const incursionsClient = builder.build();

        expect(incursionsClient).toBeInstanceOf(IncursionsClient);
    });
});
