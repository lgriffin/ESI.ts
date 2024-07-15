import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { SearchApiBuilder } from '../../../src/builders/SearchApiBuilder';
import { getConfig } from '../../../src/config/configManager';

const config = getConfig();

describe('SearchApiBuilder', () => {
    it('should build a SearchClient with all APIs instantiated', () => {
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        const builder = new SearchApiBuilder(client);
        const searchClient = builder.build();

        expect(searchClient).toBeDefined();
        expect(searchClient.searchCharacter).toBeDefined();
    });
});
