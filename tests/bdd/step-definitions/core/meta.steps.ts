import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';

const feature = loadFeature('tests/bdd/features/core/meta.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Get OpenAPI JSON specification', ({ given, when, then }) => {
    let result: any;
    const expectedSpec = {
      openapi: '3.1.0',
      info: {
        title: 'EVE Stable Infrastructure (ESI) - tranquility',
        version: '2025-12-16',
      },
      paths: {},
      components: {},
    };

    given('the ESI API is available', () => {
      jest.spyOn(client.meta, 'getOpenApiJson').mockResolvedValue(expectedSpec);
    });

    when('I request the OpenAPI JSON specification', async () => {
      result = await client.meta.getOpenApiJson();
    });

    then('I should receive a valid OpenAPI JSON document', () => {
      expect(result).toBeDefined();
      expect(result.openapi).toBe('3.1.0');
      expect(result.info).toBeDefined();
      expect(result.info.title).toContain('ESI');
      expect(result).toHaveProperty('paths');
      expect(result).toHaveProperty('components');
    });
  });

  test('Get OpenAPI YAML specification', ({ given, when, then }) => {
    let result: any;
    const expectedYamlSpec = `openapi: 3.1.0
info:
  title: EVE Stable Infrastructure (ESI) - tranquility
  version: 2025-12-16
paths: {}
components: {}`;

    given('the ESI API is available for YAML', () => {
      jest
        .spyOn(client.meta, 'getOpenApiYaml')
        .mockResolvedValue(expectedYamlSpec);
    });

    when('I request the OpenAPI YAML specification', async () => {
      result = await client.meta.getOpenApiYaml();
    });

    then('I should receive a valid OpenAPI YAML document', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('openapi: 3.1.0');
      expect(result).toContain('title: EVE Stable Infrastructure (ESI)');
      expect(result).toContain('paths:');
      expect(result).toContain('components:');
    });
  });

  test('Handle API service unavailability', ({ given, when, then }) => {
    let caughtError: any;

    given('the ESI API is unavailable', () => {
      const serviceError = new EsiError(503, 'Service Unavailable');
      jest.spyOn(client.meta, 'getOpenApiJson').mockRejectedValue(serviceError);
    });

    when('I request the OpenAPI specification', async () => {
      try {
        await client.meta.getOpenApiJson();
      } catch (e) {
        caughtError = e;
      }
    });

    then('I should receive a service unavailable error', () => {
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('Service Unavailable');
    });
  });

  test('Compare JSON and YAML specifications', ({ given, when, then }) => {
    let jsonResult: any;
    let yamlResult: any;

    const jsonSpec = {
      openapi: '3.1.0',
      info: {
        title: 'EVE Stable Infrastructure (ESI) - tranquility',
        version: '2025-12-16',
      },
      paths: { '/alliances': { get: { summary: 'List alliances' } } },
    };

    const yamlSpec = `openapi: 3.1.0
info:
  title: EVE Stable Infrastructure (ESI) - tranquility
  version: 2025-12-16
paths:
  /alliances:
    get:
      summary: List alliances`;

    given('both JSON and YAML specifications are available', () => {
      jest.spyOn(client.meta, 'getOpenApiJson').mockResolvedValue(jsonSpec);
      jest.spyOn(client.meta, 'getOpenApiYaml').mockResolvedValue(yamlSpec);
    });

    when('I retrieve both formats', async () => {
      [jsonResult, yamlResult] = await Promise.all([
        client.meta.getOpenApiJson(),
        client.meta.getOpenApiYaml(),
      ]);
    });

    then('they should contain equivalent information', () => {
      expect(jsonResult.openapi).toBe('3.1.0');
      expect(yamlResult).toContain('openapi: 3.1.0');
      expect(jsonResult.info.title).toContain('ESI');
      expect(yamlResult).toContain('title: EVE Stable Infrastructure (ESI)');
      expect(jsonResult.paths['/alliances']).toBeDefined();
      expect(yamlResult).toContain('/alliances:');
    });
  });
});
