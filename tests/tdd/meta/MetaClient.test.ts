import { ApiClient } from '../../../src/core/ApiClient';
import { MetaClient } from '../../../src/clients/MetaClient';
import { GetSwaggerJsonApi } from '../../../src/api/meta/getSwaggerJson';
import { GetSwaggerYamlApi } from '../../../src/api/meta/getSwaggerYaml';

// Mock the API classes
jest.mock('../../../src/api/meta/getSwaggerJson');
jest.mock('../../../src/api/meta/getSwaggerYaml');

describe('MetaClient', () => {
    let apiClient: jest.Mocked<ApiClient>;
    let metaClient: MetaClient;
    let mockGetSwaggerJsonApi: jest.Mocked<GetSwaggerJsonApi>;
    let mockGetSwaggerYamlApi: jest.Mocked<GetSwaggerYamlApi>;

    beforeEach(() => {
        apiClient = {
            request: jest.fn(),
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn()
        } as any;

        mockGetSwaggerJsonApi = {
            getSwaggerJson: jest.fn()
        } as any;

        mockGetSwaggerYamlApi = {
            getSwaggerYaml: jest.fn()
        } as any;

        (GetSwaggerJsonApi as jest.Mock).mockImplementation(() => mockGetSwaggerJsonApi);
        (GetSwaggerYamlApi as jest.Mock).mockImplementation(() => mockGetSwaggerYamlApi);

        metaClient = new MetaClient(apiClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getSwaggerJson', () => {
        it('should call getSwaggerJson API and return result', async () => {
            const mockSwaggerSpec = {
                openapi: '3.0.0',
                info: { title: 'EVE Swagger Interface', version: '1.0.0' }
            };

            mockGetSwaggerJsonApi.getSwaggerJson.mockResolvedValue(mockSwaggerSpec);

            const result = await metaClient.getSwaggerJson();

            expect(mockGetSwaggerJsonApi.getSwaggerJson).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockSwaggerSpec);
        });

        it('should handle errors from getSwaggerJson API', async () => {
            const mockError = new Error('API Error');
            mockGetSwaggerJsonApi.getSwaggerJson.mockRejectedValue(mockError);

            await expect(metaClient.getSwaggerJson()).rejects.toThrow('API Error');
        });
    });

    describe('getSwaggerYaml', () => {
        it('should call getSwaggerYaml API and return result', async () => {
            const mockYamlSpec = 'openapi: 3.0.0\ninfo:\n  title: EVE Swagger Interface';

            mockGetSwaggerYamlApi.getSwaggerYaml.mockResolvedValue(mockYamlSpec);

            const result = await metaClient.getSwaggerYaml();

            expect(mockGetSwaggerYamlApi.getSwaggerYaml).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockYamlSpec);
        });

        it('should handle errors from getSwaggerYaml API', async () => {
            const mockError = new Error('API Error');
            mockGetSwaggerYamlApi.getSwaggerYaml.mockRejectedValue(mockError);

            await expect(metaClient.getSwaggerYaml()).rejects.toThrow('API Error');
        });
    });

    describe('client properties', () => {
        it('should have correct name and version', () => {
            expect(metaClient.name).toBe('MetaClient');
            expect(metaClient.version).toBe('2.0.0');
        });
    });
});
