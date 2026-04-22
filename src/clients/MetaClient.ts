import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { metaEndpoints } from '../core/endpoints/metaEndpoints';
import { logInfo, logError } from '../core/logger/loggerUtil';

export class MetaClient {
  private api: ReturnType<typeof createClient<typeof metaEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof metaEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, metaEndpoints);
  }

  /**
   * Retrieves the ESI OpenAPI specification in JSON format.
   *
   * @returns The full ESI OpenAPI specification as a JSON object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOpenApiJson(): Promise<Record<string, any>> {
    return this.api.getOpenApiJson();
  }

  /**
   * Retrieves the ESI OpenAPI specification in YAML format.
   *
   * @returns The full ESI OpenAPI specification as a YAML string
   */
  async getOpenApiYaml(): Promise<string> {
    const url = `${this._client.getLink()}/meta/openapi.yaml`;

    logInfo(`Hitting endpoint: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'text/yaml, application/x-yaml, text/plain',
          'User-Agent': 'esiJS/2.0.0',
          'X-Compatibility-Date': '2025-12-16',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error) {
        logError(`Error fetching YAML: ${error.message}`);
        throw error;
      } else {
        logError(`Unexpected error: ${error}`);
        throw new Error(String(error));
      }
    }
  }

  withMetadata(): WithMetadata<Omit<MetaClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, metaEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<MetaClient, 'withMetadata'>
    >;
  }
}
