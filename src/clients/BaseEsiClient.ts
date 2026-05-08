import { ApiClient } from '../core/ApiClient';
import {
  createClient,
  CreateClientOptions,
  WithMetadata,
} from '../core/endpoints/createClient';
import { EndpointMap } from '../core/endpoints/EndpointDefinition';

type ClientMethods<T extends EndpointMap> = ReturnType<typeof createClient<T>>;

export abstract class BaseEsiClient<T extends EndpointMap> {
  protected api: ClientMethods<T>;
  protected _client: ApiClient;
  private _endpoints: T;
  private _metaApi?: ClientMethods<T>;

  constructor(client: ApiClient, endpoints: T) {
    this._client = client;
    this._endpoints = endpoints;
    this.api = createClient(client, endpoints);
  }

  withMetadata(): WithMetadata<Omit<this, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, this._endpoints, {
        returnMetadata: true,
      } as CreateClientOptions);
    }
    return this._metaApi as unknown as WithMetadata<Omit<this, 'withMetadata'>>;
  }
}
