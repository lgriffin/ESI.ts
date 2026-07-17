import { ApiClient } from '../core/ApiClient';
import {
  createClient,
  CreateClientOptions,
  WithMetadata,
  WithSafeMode,
} from '../core/endpoints/createClient';
import { EndpointMap } from '../core/endpoints/EndpointDefinition';
import { buildEndpointPath } from '../core/endpoints/buildEndpointPath';
import {
  fetchPages,
  PageResult,
} from '../core/pagination/AsyncPaginationIterator';

type ClientMethods<T extends EndpointMap> = ReturnType<typeof createClient<T>>;

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

  protected streamEndpoint<R>(
    endpointName: string & keyof T,
    ...args: unknown[]
  ): AsyncGenerator<PageResult<R>, void, undefined> {
    const def = this._endpoints[endpointName]!;
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
    );
  }

  withMetadata(): WithMetadata<Omit<this, 'withMetadata' | 'withSafeMode'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, this._endpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<this, 'withMetadata' | 'withSafeMode'>
    >;
  }

  withSafeMode(): WithSafeMode<Omit<this, 'withMetadata' | 'withSafeMode'>> {
    if (!this._safeApi) {
      this._safeApi = createClient(this._client, this._endpoints, {
        safeMode: true,
      });
    }
    return this._safeApi as unknown as WithSafeMode<
      Omit<this, 'withMetadata' | 'withSafeMode'>
    >;
  }
}
