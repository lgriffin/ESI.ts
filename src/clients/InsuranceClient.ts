import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { insuranceEndpoints } from '../core/endpoints/insuranceEndpoints';
import { InsurancePrice } from '../types/api-responses';

/**
 * A legacy domain client over the hand-written endpoint map.
 *
 * @deprecated Since 12.1.0; removed in 13.0.0. Use `createEsi()` from
 * `@lgriffin/esi.ts/client`: `esi.public` for public routes and
 * `esi.as(identity)` for authenticated ones. guides/LEGACY-REMOVAL.md
 * lists every legacy surface, its replacement and the open parity gaps.
 */
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
    return this.api.getInsurancePrices();
  }
}
