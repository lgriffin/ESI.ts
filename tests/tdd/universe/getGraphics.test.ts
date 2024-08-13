import { UniverseGraphicsApi } from '../../../src/api/universe/getGraphics';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseGraphicsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeGraphicsApi = new UniverseGraphicsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getGraphics', async () => {
        const mockResponse = [{ graphic_id: 1, name: 'Graphic 1' }, { graphic_id: 2, name: 'Graphic 2' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => universeGraphicsApi.getGraphics());
        expect(Array.isArray(result)).toBe(true);
        result.forEach((graphic: any) => {
            expect(graphic).toHaveProperty('graphic_id');
            expect(typeof graphic.graphic_id).toBe('number');
            expect(graphic).toHaveProperty('name');
            expect(typeof graphic.name).toBe('string');
        });
    });
});
