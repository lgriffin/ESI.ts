import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { uiEndpoints } from '../core/endpoints/uiEndpoints';

export class UiClient {
  private api: ReturnType<typeof createClient<typeof uiEndpoints>>;
  private _client: ApiClient;
  private _metaApi?: ReturnType<typeof createClient<typeof uiEndpoints>>;

  constructor(client: ApiClient) {
    this._client = client;
    this.api = createClient(client, uiEndpoints);
  }

  /**
   * Sets a solar system as an autopilot waypoint in the EVE client.
   *
   * @param body - The waypoint configuration including destination, whether to add to beginning, and whether to clear other waypoints
   * @requires Authentication
   */
  async setAutopilotWaypoint(body: object): Promise<void> {
    return this.api.setAutopilotWaypoint(body);
  }

  /**
   * Opens the contract window for a specific contract in the EVE client.
   *
   * @param body - The contract details including the contract ID to display
   * @requires Authentication
   */
  async openContractWindow(body: object): Promise<void> {
    return this.api.openContractWindow(body);
  }

  /**
   * Opens the information window for a specific entity in the EVE client.
   *
   * @param body - The target entity details including the target ID to display
   * @requires Authentication
   */
  async openInformationWindow(body: object): Promise<void> {
    return this.api.openInformationWindow(body);
  }

  /**
   * Opens the market details window for a specific type in the EVE client.
   *
   * @param body - The market item details including the type ID to display
   * @requires Authentication
   */
  async openMarketDetailsWindow(body: object): Promise<void> {
    return this.api.openMarketDetailsWindow(body);
  }

  /**
   * Opens the new mail composition window in the EVE client with pre-filled fields.
   *
   * @param body - The mail details including recipients, subject, and body text
   * @requires Authentication
   */
  async openNewMailWindow(body: object): Promise<void> {
    return this.api.openNewMailWindow(body);
  }

  withMetadata(): WithMetadata<Omit<UiClient, 'withMetadata'>> {
    if (!this._metaApi) {
      this._metaApi = createClient(this._client, uiEndpoints, {
        returnMetadata: true,
      });
    }
    return this._metaApi as unknown as WithMetadata<
      Omit<UiClient, 'withMetadata'>
    >;
  }
}
