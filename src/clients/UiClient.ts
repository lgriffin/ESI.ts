import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { uiEndpoints } from '../core/endpoints/uiEndpoints';

export class UiClient extends BaseEsiClient<typeof uiEndpoints> {
  constructor(client: ApiClient) {
    super(client, uiEndpoints);
  }

  /**
   * Sets a solar system as an autopilot waypoint in the EVE client.
   *
   * @param body - The waypoint configuration including destination, whether to add to beginning, and whether to clear other waypoints
   * @requires Authentication
   */
  setAutopilotWaypoint(body: object): Promise<void> {
    return this.api.setAutopilotWaypoint(body) as Promise<void>;
  }

  /**
   * Opens the contract window for a specific contract in the EVE client.
   *
   * @param body - The contract details including the contract ID to display
   * @requires Authentication
   */
  openContractWindow(body: object): Promise<void> {
    return this.api.openContractWindow(body) as Promise<void>;
  }

  /**
   * Opens the information window for a specific entity in the EVE client.
   *
   * @param body - The target entity details including the target ID to display
   * @requires Authentication
   */
  openInformationWindow(body: object): Promise<void> {
    return this.api.openInformationWindow(body) as Promise<void>;
  }

  /**
   * Opens the market details window for a specific type in the EVE client.
   *
   * @param body - The market item details including the type ID to display
   * @requires Authentication
   */
  openMarketDetailsWindow(body: object): Promise<void> {
    return this.api.openMarketDetailsWindow(body) as Promise<void>;
  }

  /**
   * Opens the new mail composition window in the EVE client with pre-filled fields.
   *
   * @param body - The mail details including recipients, subject, and body text
   * @requires Authentication
   */
  openNewMailWindow(body: object): Promise<void> {
    return this.api.openNewMailWindow(body) as Promise<void>;
  }
}
