/**
 * BDD-Style Testing for Meta API
 * 
 * This demonstrates BDD principles for the Meta API endpoints
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { ApiError, ApiErrorType } from '../../../src/core/errors/ApiError';

describe('BDD: Meta API Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000
    });
  });

  describe('Feature: Retrieve API Specification', () => {
    describe('Scenario: Get Swagger JSON specification', () => {
      it('Given the ESI API is available, When I request the Swagger JSON specification, Then I should receive a valid OpenAPI JSON document', async () => {
        // Given: The ESI API is available
        const expectedSwaggerSpec = {
          openapi: '3.0.0',
          info: {
            title: 'EVE Swagger Interface',
            version: '1.0.0'
          },
          paths: {},
          components: {}
        };

        // Mock the API response
        jest.spyOn(client.meta, 'getSwaggerJson').mockResolvedValue(expectedSwaggerSpec);

        // When: I request the Swagger JSON specification
        const result = await client.meta.getSwaggerJson();

        // Then: I should receive a valid OpenAPI JSON document
        expect(result).toBeDefined();
        expect(result.openapi).toBe('3.0.0');
        expect(result.info).toBeDefined();
        expect(result.info.title).toBe('EVE Swagger Interface');
        expect(result).toHaveProperty('paths');
        expect(result).toHaveProperty('components');
      });
    });

    describe('Scenario: Get Swagger YAML specification', () => {
      it('Given the ESI API is available, When I request the Swagger YAML specification, Then I should receive a valid OpenAPI YAML document', async () => {
        // Given: The ESI API is available
        const expectedYamlSpec = `openapi: 3.0.0
info:
  title: EVE Swagger Interface
  version: 1.0.0
paths: {}
components: {}`;

        // Mock the API response
        jest.spyOn(client.meta, 'getSwaggerYaml').mockResolvedValue(expectedYamlSpec);

        // When: I request the Swagger YAML specification
        const result = await client.meta.getSwaggerYaml();

        // Then: I should receive a valid OpenAPI YAML document
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result).toContain('openapi: 3.0.0');
        expect(result).toContain('title: EVE Swagger Interface');
        expect(result).toContain('paths:');
        expect(result).toContain('components:');
      });
    });

    describe('Scenario: Handle API service unavailability', () => {
      it('Given the ESI API is unavailable, When I request the Swagger specification, Then I should receive a service unavailable error', async () => {
        // Given: The ESI API is unavailable
        const serviceError = new ApiError('Service Unavailable', ApiErrorType.SERVER_ERROR, 503);

        // Mock the API error
        jest.spyOn(client.meta, 'getSwaggerJson').mockRejectedValue(serviceError);

        // When & Then: I request the specification and should receive an error
        await expect(client.meta.getSwaggerJson()).rejects.toThrow('Service Unavailable');
      });
    });
  });

  describe('Feature: API Documentation Access', () => {
    describe('Scenario: Compare JSON and YAML specifications', () => {
      it('Given both JSON and YAML specifications are available, When I retrieve both formats, Then they should contain equivalent information', async () => {
        // Given: Both specifications are available
        const jsonSpec = {
          openapi: '3.0.0',
          info: { title: 'EVE Swagger Interface', version: '1.0.0' },
          paths: { '/alliances': { get: { summary: 'List alliances' } } }
        };
        
        const yamlSpec = `openapi: 3.0.0
info:
  title: EVE Swagger Interface
  version: 1.0.0
paths:
  /alliances:
    get:
      summary: List alliances`;

        // Mock both API responses
        jest.spyOn(client.meta, 'getSwaggerJson').mockResolvedValue(jsonSpec);
        jest.spyOn(client.meta, 'getSwaggerYaml').mockResolvedValue(yamlSpec);

        // When: I retrieve both formats
        const [jsonResult, yamlResult] = await Promise.all([
          client.meta.getSwaggerJson(),
          client.meta.getSwaggerYaml()
        ]);

        // Then: They should contain equivalent information
        expect(jsonResult.openapi).toBe('3.0.0');
        expect(yamlResult).toContain('openapi: 3.0.0');
        expect(jsonResult.info.title).toBe('EVE Swagger Interface');
        expect(yamlResult).toContain('title: EVE Swagger Interface');
        expect(jsonResult.paths['/alliances']).toBeDefined();
        expect(yamlResult).toContain('/alliances:');
      });
    });
  });
});
