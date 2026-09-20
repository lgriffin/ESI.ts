import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { insuranceEndpoints } from '../core/endpoints/insuranceEndpoints';
import { InsurancePrice } from '../types/api-responses';

export class InsuranceClient extends BaseEsiClient<typeof insuranceEndpoints> {
  constructor(client: ApiClient) {
    super(client, insuranceEndpoints);
  }

  /**
   * Retrieves available insurance levels and their costs for all ship types.
   *
   * @returns An array of insurance price listings per ship type
   */
  getInsurancePrices(): Promise<InsurancePrice[]> {
    return this.api.getInsurancePrices() as Promise<InsurancePrice[]>;
  }
}
