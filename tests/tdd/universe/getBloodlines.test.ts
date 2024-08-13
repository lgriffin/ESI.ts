import { UniverseBloodlinesApi } from '../../../src/api/universe/getBloodlines';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseBloodlinesApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeBloodlinesApi = new UniverseBloodlinesApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getBloodlines', async () => {
        const mockResponse = [{ bloodline_id: 1, name: 'Bloodline 1' }, { bloodline_id: 2, name: 'Bloodline 2' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeBloodlinesApi.getBloodlines());
        expect(Array.isArray(result)).toBe(true);
        result.forEach((bloodline: any) => {
            expect(bloodline).toHaveProperty('bloodline_id');
            expect(typeof bloodline.bloodline_id).toBe('number');
            expect(bloodline).toHaveProperty('name');
            expect(typeof bloodline.name).toBe('string');
        });
    });
});
