import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { insuranceEndpoints } from '../core/endpoints/insuranceEndpoints';
import { InsurancePrice } from '../types/api-responses';

export class InsuranceClient {
  private api: ReturnType<typeof createClient<typeof insuranceEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof insuranceEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, insuranceEndpoints);
  }

  /**
   * Retrieves available insurance levels and their costs for all ship types.
   *
   * @returns An array of insurance price listings per ship type
   */
  async getInsurancePrices(): Promise<InsurancePrice[]> {
    return this.api.getInsurancePrices();
  }

  withMetadata(): WithMetadata<Omit<InsuranceClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, insuranceEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<InsuranceClient, 'withMetadata'>
    >;
  }
}
