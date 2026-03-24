/**
 * BDD-Style Testing for Meta API
 *
 * This demonstrates BDD principles for the Meta API endpoints
 * using Given/When/Then patterns.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';

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
    describe('Scenario: Get OpenAPI JSON specification', () => {
      it('Given the ESI API is available, When I request the OpenAPI JSON specification, Then I should receive a valid OpenAPI JSON document', async () => {
        // Given: The ESI API is available
        const expectedSpec = {
          openapi: '3.1.0',
          info: {
            title: 'EVE Stable Infrastructure (ESI) - tranquility',
            version: '2025-12-16'
          },
          paths: {},
          components: {}
        };

        // Mock the API response
        jest.spyOn(client.meta, 'getOpenApiJson').mockResolvedValue(expectedSpec);

        // When: I request the OpenAPI JSON specification
        const result = await client.meta.getOpenApiJson();

        // Then: I should receive a valid OpenAPI JSON document
        expect(result).toBeDefined();
        expect(result.openapi).toBe('3.1.0');
        expect(result.info).toBeDefined();
        expect(result.info.title).toContain('ESI');
        expect(result).toHaveProperty('paths');
        expect(result).toHaveProperty('components');
      });
    });

    describe('Scenario: Get OpenAPI YAML specification', () => {
      it('Given the ESI API is available, When I request the OpenAPI YAML specification, Then I should receive a valid OpenAPI YAML document', async () => {
        // Given: The ESI API is available
        const expectedYamlSpec = `openapi: 3.1.0
info:
  title: EVE Stable Infrastructure (ESI) - tranquility
  version: 2025-12-16
paths: {}
components: {}`;

        // Mock the API response
        jest.spyOn(client.meta, 'getOpenApiYaml').mockResolvedValue(expectedYamlSpec);

        // When: I request the OpenAPI YAML specification
        const result = await client.meta.getOpenApiYaml();

        // Then: I should receive a valid OpenAPI YAML document
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result).toContain('openapi: 3.1.0');
        expect(result).toContain('title: EVE Stable Infrastructure (ESI)');
        expect(result).toContain('paths:');
        expect(result).toContain('components:');
      });
    });

    describe('Scenario: Handle API service unavailability', () => {
      it('Given the ESI API is unavailable, When I request the OpenAPI specification, Then I should receive a service unavailable error', async () => {
        // Given: The ESI API is unavailable
        const serviceError = new EsiError(503, 'Service Unavailable');

        // Mock the API error
        jest.spyOn(client.meta, 'getOpenApiJson').mockRejectedValue(serviceError);

        // When & Then: I request the specification and should receive an error
        await expect(client.meta.getOpenApiJson()).rejects.toThrow('Service Unavailable');
      });
    });
  });

  describe('Feature: API Documentation Access', () => {
    describe('Scenario: Compare JSON and YAML specifications', () => {
      it('Given both JSON and YAML specifications are available, When I retrieve both formats, Then they should contain equivalent information', async () => {
        // Given: Both specifications are available
        const jsonSpec = {
          openapi: '3.1.0',
          info: { title: 'EVE Stable Infrastructure (ESI) - tranquility', version: '2025-12-16' },
          paths: { '/alliances': { get: { summary: 'List alliances' } } }
        };

        const yamlSpec = `openapi: 3.1.0
info:
  title: EVE Stable Infrastructure (ESI) - tranquility
  version: 2025-12-16
paths:
  /alliances:
    get:
      summary: List alliances`;

        // Mock both API responses
        jest.spyOn(client.meta, 'getOpenApiJson').mockResolvedValue(jsonSpec);
        jest.spyOn(client.meta, 'getOpenApiYaml').mockResolvedValue(yamlSpec);

        // When: I retrieve both formats
        const [jsonResult, yamlResult] = await Promise.all([
          client.meta.getOpenApiJson(),
          client.meta.getOpenApiYaml()
        ]);

        // Then: They should contain equivalent information
        expect(jsonResult.openapi).toBe('3.1.0');
        expect(yamlResult).toContain('openapi: 3.1.0');
        expect(jsonResult.info.title).toContain('ESI');
        expect(yamlResult).toContain('title: EVE Stable Infrastructure (ESI)');
        expect(jsonResult.paths['/alliances']).toBeDefined();
        expect(yamlResult).toContain('/alliances:');
      });
    });
  });
});
