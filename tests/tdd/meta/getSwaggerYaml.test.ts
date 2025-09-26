import { GetSwaggerYamlApi } from '../../../src/api/meta/getSwaggerYaml';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

let getSwaggerYamlApi: GetSwaggerYamlApi;

beforeAll(() => {
    getSwaggerYamlApi = new GetSwaggerYamlApi(getClient());
});

describe('GetSwaggerYamlApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should call getSwaggerYaml and return swagger specification as YAML string', async () => {
        const mockYamlSpec = `openapi: 3.0.0
info:
  title: EVE Swagger Interface
  version: 1.0.0
paths: {}`;

        fetchMock.mockResponseOnce(mockYamlSpec);

        const result = await getSwaggerYamlApi.getSwaggerYaml();

        expect(result).toEqual(mockYamlSpec);
        expect(typeof result).toBe('string');
        expect(result).toContain('openapi: 3.0.0');
        expect(result).toContain('title: EVE Swagger Interface');
    });

    it('should handle API errors gracefully', async () => {
        fetchMock.mockRejectOnce(new Error('API Error'));

        await expect(getSwaggerYamlApi.getSwaggerYaml()).rejects.toThrow();
    });
});
