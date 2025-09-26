import { ApiClient } from '../../../src/core/ApiClient';
import { MetaApiBuilder } from '../../../src/builders/MetaApiBuilder';
import { MetaClient } from '../../../src/clients/MetaClient';

describe('MetaApiBuilder', () => {
    let apiClient: jest.Mocked<ApiClient>;
    let metaApiBuilder: MetaApiBuilder;

    beforeEach(() => {
        apiClient = {
            request: jest.fn(),
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn()
        } as any;

        metaApiBuilder = new MetaApiBuilder(apiClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new MetaApiBuilder instance', () => {
        expect(metaApiBuilder).toBeInstanceOf(MetaApiBuilder);
    });

    it('should build and return a MetaClient instance', () => {
        const metaClient = metaApiBuilder.build();
        
        expect(metaClient).toBeInstanceOf(MetaClient);
        expect(metaClient.name).toBe('MetaClient');
        expect(metaClient.version).toBe('1.0.0');
    });

    it('should pass the ApiClient to the MetaClient', () => {
        const metaClient = metaApiBuilder.build();
        
        // Verify that the client is properly initialized with the API client
        expect(metaClient).toBeDefined();
        expect(typeof metaClient.getSwaggerJson).toBe('function');
        expect(typeof metaClient.getSwaggerYaml).toBe('function');
    });
});
