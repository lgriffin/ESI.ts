import { GetSwaggerJsonApi } from '../../../src/api/meta/getSwaggerJson';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

let getSwaggerJsonApi: GetSwaggerJsonApi;

beforeAll(() => {
    getSwaggerJsonApi = new GetSwaggerJsonApi(getClient());
});

describe('GetSwaggerJsonApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should call getSwaggerJson and return swagger specification', async () => {
        const mockSwaggerSpec = {
            openapi: '3.0.0',
            info: { title: 'EVE Swagger Interface', version: '1.0.0' },
            paths: {}
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockSwaggerSpec));

        const result = await getBody(() => getSwaggerJsonApi.getSwaggerJson());

        expect(result).toEqual(mockSwaggerSpec);
        expect(result).toHaveProperty('openapi', '3.0.0');
        expect(result).toHaveProperty('info');
        expect(result.info).toHaveProperty('title', 'EVE Swagger Interface');
    });

    it('should handle API errors gracefully', async () => {
        fetchMock.mockRejectOnce(new Error('API Error'));

        await expect(getBody(() => getSwaggerJsonApi.getSwaggerJson())).rejects.toThrow();
    });
});
