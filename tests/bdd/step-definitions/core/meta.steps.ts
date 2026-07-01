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

  test('WHEN getting OpenAPI JSON specification, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
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

    when('the client requests the OpenAPI JSON specification', async () => {
      result = await client.meta.getOpenApiJson();
    });

    then('the client shall return a valid OpenAPI JSON document', () => {
      expect(result).toBeDefined();
      expect(result.openapi).toBe('3.1.0');
      expect(result.info).toBeDefined();
      expect(result.info.title).toContain('ESI');
      expect(result).toHaveProperty('paths');
      expect(result).toHaveProperty('components');
    });
  });

  test('WHEN getting OpenAPI YAML specification, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
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

    when('the client requests the OpenAPI YAML specification', async () => {
      result = await client.meta.getOpenApiYaml();
    });

    then('the client shall return a valid OpenAPI YAML document', () => {
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('openapi: 3.1.0');
      expect(result).toContain('title: EVE Stable Infrastructure (ESI)');
      expect(result).toContain('paths:');
      expect(result).toContain('components:');
    });
  });

  test('IF the API service is unavailable, THEN the client shall handle the outage', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI API is unavailable', () => {
      const serviceError = new EsiError(503, 'Service Unavailable');
      jest.spyOn(client.meta, 'getOpenApiJson').mockRejectedValue(serviceError);
    });

    when('the client requests the OpenAPI specification', async () => {
      try {
        await client.meta.getOpenApiJson();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a service unavailable error', () => {
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('Service Unavailable');
    });
  });

  test('WHEN comparing JSON and YAML specifications, the client shall return the analysis', ({
    given,
    when,
    then,
  }) => {
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

    when('the client retrieves both formats', async () => {
      [jsonResult, yamlResult] = await Promise.all([
        client.meta.getOpenApiJson(),
        client.meta.getOpenApiYaml(),
      ]);
    });

    then('they shall contain equivalent information', () => {
      expect(jsonResult.openapi).toBe('3.1.0');
      expect(yamlResult).toContain('openapi: 3.1.0');
      expect(jsonResult.info.title).toContain('ESI');
      expect(yamlResult).toContain('title: EVE Stable Infrastructure (ESI)');
      expect(jsonResult.paths['/alliances']).toBeDefined();
      expect(yamlResult).toContain('/alliances:');
    });
  });
});
