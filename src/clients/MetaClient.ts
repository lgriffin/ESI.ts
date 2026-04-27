import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { metaEndpoints } from '../core/endpoints/metaEndpoints';
import { logInfo, logError } from '../core/logger/loggerUtil';
import { USER_AGENT, COMPATIBILITY_DATE } from '../core/constants';

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
  /* eslint-disable @typescript-eslint/no-explicit-any */
  getOpenApiJson(): Promise<Record<string, any>> {
    return this.api.getOpenApiJson() as Promise<Record<string, any>>;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

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
          'User-Agent': USER_AGENT,
          'X-Compatibility-Date': COMPATIBILITY_DATE,
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
        logError(`Unexpected error: ${String(error)}`);
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
