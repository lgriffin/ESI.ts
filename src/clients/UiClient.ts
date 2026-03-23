import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { uiEndpoints } from '../core/endpoints/uiEndpoints';

export class UiClient {
    private api: ReturnType<typeof createClient<typeof uiEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, uiEndpoints);
    }

    async setAutopilotWaypoint(body: object): Promise<void> {
        return this.api.setAutopilotWaypoint(body);
    }

    async openContractWindow(body: object): Promise<void> {
        return this.api.openContractWindow(body);
    }

    async openInformationWindow(body: object): Promise<void> {
        return this.api.openInformationWindow(body);
    }

    async openMarketDetailsWindow(body: object): Promise<void> {
        return this.api.openMarketDetailsWindow(body);
    }

    async openNewMailWindow(body: object): Promise<void> {
        return this.api.openNewMailWindow(body);
    }
}
