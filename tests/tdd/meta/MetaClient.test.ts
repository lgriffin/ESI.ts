import { MetaClient } from '../../../src/clients/MetaClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('MetaClient', () => {
  let metaClient: MetaClient;

  beforeEach(() => {
    fetchMock.resetMocks();

    const config = getConfig();
    const client = new ApiClientBuilder()
      .setClientId(config.projectName)
      .setLink(config.link)
      .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
      .build();

    metaClient = new MetaClient(client);
  });

  it('should return the OpenAPI JSON specification', async () => {
    const mockResponse = {
      openapi: '3.0.0',
      info: {
        title: 'EVE Swagger Interface',
        version: '1.25',
      },
      paths: {},
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => metaClient.getOpenApiJson());

    expect(result.openapi).toBe('3.0.0');
    expect(result.info.title).toBe('EVE Swagger Interface');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/meta/openapi.json',
    );
  });

  it('should return the OpenAPI YAML specification', async () => {
    const mockYaml = [
      'openapi: "3.0.0"',
      'info:',
      '  title: EVE Swagger Interface',
      '  version: "1.25"',
    ].join('\n');

    fetchMock.mockResponseOnce(mockYaml, {
      headers: { 'content-type': 'text/yaml' },
    });

    const result = await metaClient.getOpenApiYaml();

    expect(result).toContain('openapi: "3.0.0"');
    expect(result).toContain('EVE Swagger Interface');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/meta/openapi.yaml',
    );
  });

  it('should throw on non-ok YAML response', async () => {
    fetchMock.mockResponseOnce('Not Found', {
      status: 404,
      statusText: 'Not Found',
    });
    await expect(metaClient.getOpenApiYaml()).rejects.toThrow('HTTP 404');
  });

  it('should rethrow Error instances from YAML fetch', async () => {
    fetchMock.mockRejectOnce(new Error('Network failure'));
    await expect(metaClient.getOpenApiYaml()).rejects.toThrow(
      'Network failure',
    );
  });

  it('should wrap non-Error exceptions from YAML fetch', async () => {
    fetchMock.mockRejectOnce('string error' as unknown as Error);
    await expect(metaClient.getOpenApiYaml()).rejects.toThrow('string error');
  });
});
