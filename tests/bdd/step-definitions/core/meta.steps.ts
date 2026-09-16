import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  RETRYABLE_ATTEMPTS,
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0025-meta.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('JSON specification returns version 3.1.0 with paths and components', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const spec = {
      openapi: '3.1.0',
      info: {
        title: 'EVE Stable Infrastructure (ESI) - tranquility',
        version: '2025-12-16',
      },
      paths: {
        '/alliances': { get: { operationId: 'GetAlliances' } },
        '/status': { get: { operationId: 'GetStatus' } },
      },
      components: {
        schemas: {
          AlliancesGet: { type: 'array', items: { type: 'integer' } },
        },
      },
    };

    given('the ESI API is available', () => {
      queueResponse({ match: '/meta/openapi.json', body: spec });
    });

    when('the client requests the OpenAPI JSON specification', async () => {
      result = await client.meta.getOpenApiJson();
    });

    then('the client shall return a valid OpenAPI JSON document', () => {
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toBe('/meta/openapi.json');
      expect(result.openapi).toBe('3.1.0');
      expect(result.info).toEqual({
        title: 'EVE Stable Infrastructure (ESI) - tranquility',
        version: '2025-12-16',
      });
      expect(Object.keys(result.paths)).toEqual(['/alliances', '/status']);
      expect(result.components).toEqual(spec.components);
    });
  });

  test('YAML specification returns the raw document text', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const yamlSpec = `openapi: 3.1.0
info:
  title: EVE Stable Infrastructure (ESI) - tranquility
  version: 2025-12-16
paths: {}
components: {}
`;

    given('the ESI API is available for YAML', () => {
      queueResponse({
        match: '/meta/openapi.yaml',
        headers: { 'content-type': 'application/yaml' },
        body: yamlSpec,
      });
    });

    when('the client requests the OpenAPI YAML specification', async () => {
      result = await client.meta.getOpenApiYaml();
    });

    then('the client shall return a valid OpenAPI YAML document', () => {
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toBe('/meta/openapi.yaml');
      expect(lastRequest().headers.accept).toContain('yaml');
      // Returned verbatim: byte-identical to what ESI sent, not parsed.
      expect(typeof result).toBe('string');
      expect(result).toBe(yamlSpec);
    });
  });

  test('Specification request during an outage reports Service Unavailable', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI API is unavailable', () => {
      // 503 is retryable, so the outage has to outlast the retry budget.
      queueError(503, 'Service Unavailable', {
        match: '/meta/openapi.json',
        times: RETRYABLE_ATTEMPTS,
      });
    });

    when('the client requests the OpenAPI specification', async () => {
      try {
        await client.meta.getOpenApiJson();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a service unavailable error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(caughtError.message).toContain('Service Unavailable');
      expect(sentRequests()).toHaveLength(RETRYABLE_ATTEMPTS);
    });
  });

  test('JSON and YAML fetched in parallel describe the same alliances path', ({
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
      summary: List alliances
`;

    given('both JSON and YAML specifications are available', () => {
      queueResponse({ match: '/meta/openapi.json', body: jsonSpec });
      queueResponse({
        match: '/meta/openapi.yaml',
        headers: { 'content-type': 'application/yaml' },
        body: yamlSpec,
      });
    });

    when('the client retrieves both formats', async () => {
      [jsonResult, yamlResult] = await Promise.all([
        client.meta.getOpenApiJson(),
        client.meta.getOpenApiYaml(),
      ]);
    });

    then('they shall contain equivalent information', () => {
      expect(
        sentRequests()
          .map((r) => r.url.pathname)
          .sort(),
      ).toEqual(['/meta/openapi.json', '/meta/openapi.yaml']);

      expect(jsonResult.openapi).toBe('3.1.0');
      expect(yamlResult).toContain(`openapi: ${jsonResult.openapi}\n`);
      expect(yamlResult).toContain(`  title: ${jsonResult.info.title}\n`);
      expect(Object.keys(jsonResult.paths)).toEqual(['/alliances']);
      expect(yamlResult).toContain('\n  /alliances:\n');
      expect(yamlResult).toContain(
        `summary: ${jsonResult.paths['/alliances'].get.summary}`,
      );
    });
  });
});
