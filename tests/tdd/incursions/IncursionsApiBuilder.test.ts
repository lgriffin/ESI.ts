import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { IncursionsApiBuilder } from '../../../src/builders/IncursionsApiBuilder';
import { getConfig } from '../../../src/config/configManager';

describe('IncursionsApiBuilder', () => {
    it('should build an IncursionsClient correctly', () => {
        const config = getConfig();
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        const incursionsClient = new IncursionsApiBuilder(client).build();

        expect(incursionsClient).toBeDefined();
        expect(incursionsClient.getIncursions).toBeDefined();
    });
});
