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
   * @param destinationId - The solar system, station, or structure ID to set as waypoint
   * @param addToBeginning - Whether to add the waypoint to the beginning of the route
   * @param clearOtherWaypoints - Whether to clear existing waypoints first
   * @requires Authentication
   */
  setAutopilotWaypoint(
    destinationId: number,
    addToBeginning: boolean,
    clearOtherWaypoints: boolean,
  ): Promise<void> {
    return this.api.setAutopilotWaypoint(
      destinationId,
      addToBeginning,
      clearOtherWaypoints,
    ) as Promise<void>;
  }

  /**
   * Opens the contract window for a specific contract in the EVE client.
   *
   * @param contractId - The contract ID to display
   * @requires Authentication
   */
  openContractWindow(contractId: number): Promise<void> {
    return this.api.openContractWindow(contractId) as Promise<void>;
  }

  /**
   * Opens the information window for a specific entity in the EVE client.
   *
   * @param targetId - The character, corporation, alliance, or type ID to display
   * @requires Authentication
   */
  openInformationWindow(targetId: number): Promise<void> {
    return this.api.openInformationWindow(targetId) as Promise<void>;
  }

  /**
   * Opens the market details window for a specific type in the EVE client.
   *
   * @param typeId - The inventory type ID to display market details for
   * @requires Authentication
   */
  openMarketDetailsWindow(typeId: number): Promise<void> {
    return this.api.openMarketDetailsWindow(typeId) as Promise<void>;
  }

  /**
   * Opens the new mail composition window in the EVE client with pre-filled fields.
   *
   * @param body - The mail details including recipients (integer array), subject, and body text
   * @requires Authentication
   */
  openNewMailWindow(body: object): Promise<void> {
    return this.api.openNewMailWindow(body) as Promise<void>;
  }
}
