import { UniverseGraphicByIdApi } from '../../../src/api/universe/getGraphicById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('UniverseGraphicByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const universeGraphicByIdApi = new UniverseGraphicByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getGraphicById', async () => {
        const mockResponse = {
            graphic_id: 1,
            file: 'graphic1.dds',
            description: 'Graphic 1 description'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        type GraphicResponse = {
            graphic_id: number;
            file: string;
            description: string;
        };

        const result = await getBody(() => universeGraphicByIdApi.getGraphicById(1)) as GraphicResponse;

        expect(result).toHaveProperty('graphic_id');
        expect(typeof result.graphic_id).toBe('number');
        expect(result).toHaveProperty('file');
        expect(typeof result.file).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
    });
});
