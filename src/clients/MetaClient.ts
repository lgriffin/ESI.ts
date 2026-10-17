import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { metaEndpoints } from '../core/endpoints/metaEndpoints';
import {
  MetaChangelog,
  MetaCompatibilityDates,
  MetaName,
  MetaStatus,
} from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
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
  getOpenApiYaml(): Promise<string> {
    return this.api.getOpenApiYaml();
  }

  /**
   * Retrieves the ESI changelog data.
   *
   * @returns `{ changelog }`: the change entries keyed by compatibility date
   */
  getChangelog(): Promise<MetaChangelog> {
    return this.api.getChangelog();
  }

  /**
   * Retrieves the list of ESI compatibility dates.
   *
   * @returns An object containing the list of compatibility dates
   */
  getCompatibilityDates(): Promise<MetaCompatibilityDates> {
    return this.api.getCompatibilityDates();
  }

  /**
   * Retrieves the ESI name.
   *
   * @returns `{ current, history }`: the name ESI has now and the dated names
   *   it had before
   */
  getName(): Promise<MetaName> {
    return this.api.getName();
  }

  /**
   * Retrieves the health of each ESI route.
   *
   * @returns `{ routes }`, one entry per route with its method, path and
   *   status ('OK', 'Degraded', 'Down', ...)
   */
  getStatus(): Promise<MetaStatus> {
    return this.api.getStatus();
  }
}
