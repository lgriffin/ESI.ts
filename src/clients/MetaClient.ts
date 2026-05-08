import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { metaEndpoints } from '../core/endpoints/metaEndpoints';
import { logInfo, logError } from '../core/logger/loggerUtil';
import { USER_AGENT, COMPATIBILITY_DATE } from '../core/constants';

export class MetaClient extends BaseEsiClient<typeof metaEndpoints> {
  constructor(client: ApiClient) {
    super(client, metaEndpoints);
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
}
