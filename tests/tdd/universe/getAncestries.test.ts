import { UniverseAncestriesApi } from '../../../src/api/universe/getAncestries';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseAncestriesApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeAncestriesApi = new UniverseAncestriesApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getAncestries', async () => {
        const mockResponse = [{ ancestry_id: 1, name: 'Ancestry 1' }, { ancestry_id: 2, name: 'Ancestry 2' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeAncestriesApi.getAncestries());
        expect(Array.isArray(result)).toBe(true);
        result.forEach((ancestry: any) => {
            expect(ancestry).toHaveProperty('ancestry_id');
            expect(typeof ancestry.ancestry_id).toBe('number');
            expect(ancestry).toHaveProperty('name');
            expect(typeof ancestry.name).toBe('string');
        });
    });
});
