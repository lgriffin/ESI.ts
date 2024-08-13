import { getMarketGroups } from '../../../src/api/market/getMarketGroups';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

const marketGroupsApi = new getMarketGroups(client);

describe('GetMarketGroupsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return market groups', async () => {
        const mockResponse = [
            {
                market_group_id: 1,
                name: 'Group 1',
                description: 'Description 1',
                types: [34, 35, 36]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => marketGroupsApi.getMarketGroups());

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(group => {
            expect(group).toHaveProperty('market_group_id');
            expect(group).toHaveProperty('name');
            expect(group).toHaveProperty('description');
            expect(Array.isArray(group.types)).toBe(true);
            group.types.forEach((typeId: number) => {
                expect(typeof typeId).toBe('number');
            });
        });
    });
});
