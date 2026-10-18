import { ApiClient } from '../core/ApiClient';
import {
  createClient,
  CreateClientOptions,
  WithMetadata,
  WithSafeMode,
} from '../core/endpoints/createClient';
import { EndpointMap } from '../core/endpoints/EndpointDefinition';
import { buildEndpointPath } from '../core/endpoints/buildEndpointPath';
import { warnIfDeprecated } from '../core/endpoints/deprecationWarning';
import type { EsiDiagnostics } from '../core/EsiDiagnostics';
import { logInfo } from '../core/logger/clientLog';
import {
  diagnosticsFor,
  shutdownOwnedPipeline,
} from '../core/pipelineOwnership';
import {
  fetchAllPages,
  fetchPages,
  PageResult,
} from '../core/pagination/AsyncPaginationIterator';

// A text endpoint (meta/openapi.yaml) is one document, not a page of JSON,
// so the page helpers refuse it rather than fail parsing it as JSON.
function notPageable(endpointName: string): TypeError {
  return new TypeError(
    `${endpointName} returns a text document and cannot be paged; call it directly.`,
  );
}

type ClientMethods<T extends EndpointMap> = ReturnType<typeof createClient<T>>;

/**
 * The base of the custom domain clients: an endpoint map turned into methods,
 * plus the `stream*`/`fetchAll*` page helpers and `withMetadata`/`withSafeMode`.
 * Extend it for a custom domain client of your own.
 */
export abstract class BaseEsiClient<T extends EndpointMap> {
  protected api: ClientMethods<T>;
  protected _client: ApiClient;
  protected _endpoints: T;
  private _metaApi?: ClientMethods<T>;
  private _safeApi?: ClientMethods<T>;

  constructor(client: ApiClient, endpoints: T) {
    this._client = client;
    this._endpoints = endpoints;
    this.api = createClient(client, endpoints);
  }

  public streamEndpoint<R>(
    endpointName: string & keyof T,
    ...args: unknown[]
  ): AsyncGenerator<PageResult<R>, void, undefined> {
    const def = this._endpoints[endpointName]!;
    if (def.textResponse) throw notPageable(endpointName);
    warnIfDeprecated(this._client, 'Endpoint', endpointName, def.deprecated, {
      endpoint: endpointName,
    });
    const { path, body } = buildEndpointPath(
      def,
      args,
      this._client.getDatasource(),
    );
    return fetchPages<R>(
      this._client,
      path,
      def.method,
      def.requiresAuth,
      body,
      def.path,
      def.responseSchema,
      def.emptyWhenNoContent === true,
    );
  }

  public fetchAllEndpoint<R>(
    endpointName: string & keyof T,
    args: unknown[],
    concurrency?: number,
  ): Promise<R[]> {
    const def = this._endpoints[endpointName]!;
    if (def.textResponse) return Promise.reject(notPageable(endpointName));
    warnIfDeprecated(this._client, 'Endpoint', endpointName, def.deprecated, {
      endpoint: endpointName,
    });
    const { path, body } = buildEndpointPath(
      def,
      args,
      this._client.getDatasource(),
    );
    return fetchAllPages<R>(
      this._client,
      path,
      def.method,
      def.requiresAuth,
      body,
      def.path,
      def.responseSchema,
      concurrency,
      def.emptyWhenNoContent === true,
    );
  }

  withMetadata(): WithMetadata<
    Omit<this, 'withMetadata' | 'withSafeMode' | 'diagnostics' | 'shutdown'>
  > {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, this._endpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<this, 'withMetadata' | 'withSafeMode' | 'diagnostics' | 'shutdown'>
    >;
  }

  withSafeMode(): WithSafeMode<
    Omit<this, 'withMetadata' | 'withSafeMode' | 'diagnostics' | 'shutdown'>
  > {
    if (!this._safeApi) {
      this._safeApi = createClient(this._client, this._endpoints, {
        safeMode: true,
      });
    }
    return this._safeApi as unknown as WithSafeMode<
      Omit<this, 'withMetadata' | 'withSafeMode' | 'diagnostics' | 'shutdown'>
    >;
  }

  /**
   * Reads and resets the cache, circuit breaker and deduplicator this client
   * uses: its own when `EsiApiFactory.createClient` built it, otherwise the
   * ones it shares with its `EsiClient` or `CustomEsiClient`, through the
   * same object that client's `diagnostics` returns.
   */
  get diagnostics(): EsiDiagnostics {
    return diagnosticsFor(this._client);
  }

  /**
   * Stops the cleanup timers of the cache and circuit breaker a client from
   * `EsiApiFactory.createClient` built, and drops its in-flight table; a
   * cache store or circuit breaker supplied in its config is left to its
   * owner. On a client reached through `EsiClient` or `CustomEsiClient`
   * this does nothing: shut that client down instead.
   */
  shutdown(): void {
    if (shutdownOwnedPipeline(this._client)) {
      logInfo(this._client, 'Domain client shutdown completed');
    }
  }
}
