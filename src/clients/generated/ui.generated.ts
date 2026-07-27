/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { uiEndpoints } from '../../core/endpoints/uiEndpoints';

export class GeneratedUiClient extends BaseEsiClient<typeof uiEndpoints> {
  constructor(client: ApiClient) {
    super(client, uiEndpoints);
  }

  /**
   * POST setAutopilotWaypoint
   * @requires Authentication
   */
  setAutopilotWaypoint(destinationId?: string | number | boolean, addToBeginning?: string | number | boolean, clearOtherWaypoints?: string | number | boolean): Promise<unknown> {
    return this.api.setAutopilotWaypoint(destinationId, addToBeginning, clearOtherWaypoints) as Promise<unknown>;
  }

  /**
   * POST openContractWindow
   * @requires Authentication
   */
  openContractWindow(contractId?: string | number | boolean): Promise<unknown> {
    return this.api.openContractWindow(contractId) as Promise<unknown>;
  }

  /**
   * POST openInformationWindow
   * @requires Authentication
   */
  openInformationWindow(targetId?: string | number | boolean): Promise<unknown> {
    return this.api.openInformationWindow(targetId) as Promise<unknown>;
  }

  /**
   * POST openMarketDetailsWindow
   * @requires Authentication
   */
  openMarketDetailsWindow(typeId?: string | number | boolean): Promise<unknown> {
    return this.api.openMarketDetailsWindow(typeId) as Promise<unknown>;
  }

  /**
   * POST openNewMailWindow
   * @requires Authentication
   */
  openNewMailWindow(...args: Parameters<(typeof this.api)['openNewMailWindow']>): Promise<unknown> {
    return this.api.openNewMailWindow(...args) as Promise<unknown>;
  }
}
