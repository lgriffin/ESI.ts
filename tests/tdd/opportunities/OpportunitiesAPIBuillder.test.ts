import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { OpportunitiesApiBuilder } from '../../../src/builders/OpportunitiesAPIBuilder';
import { getConfig } from '../../../src/config/configManager';

const config = getConfig();

describe('OpportunitiesAPIBuilder', () => {
    it('should build an OpportunitiesClient with all APIs instantiated', () => {
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        const builder = new OpportunitiesApiBuilder(client);
        const opportunitiesClient = builder.build();

        expect(opportunitiesClient).toBeDefined();
        expect(opportunitiesClient.getCharacterOpportunities).toBeDefined();
        expect(opportunitiesClient.getOpportunitiesGroups).toBeDefined();
        expect(opportunitiesClient.getOpportunitiesGroupById).toBeDefined();
        expect(opportunitiesClient.getOpportunitiesTasks).toBeDefined();
        expect(opportunitiesClient.getOpportunitiesTaskById).toBeDefined();
    });
});
