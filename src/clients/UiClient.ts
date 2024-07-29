import { ApiClient } from '../core/ApiClient';
import { PostAutopilotWaypointApi } from '../api/ui/postAutopilotWaypoint';
import { PostOpenContractWindowApi } from '../api/ui/postOpenContractWindow';
import { PostOpenInformationWindowApi } from '../api/ui/postOpenInformationWindow';
import { PostOpenMarketDetailsWindowApi } from '../api/ui/postOpenMarketDetailsWindow';
import { PostOpenNewMailWindowApi } from '../api/ui/postOpenNewMailWindow';

export class UIClient {
    private postAutopilotWaypointApi: PostAutopilotWaypointApi;
    private postOpenContractWindowApi: PostOpenContractWindowApi;
    private postOpenInformationWindowApi: PostOpenInformationWindowApi;
    private postOpenMarketDetailsWindowApi: PostOpenMarketDetailsWindowApi;
    private postOpenNewMailWindowApi: PostOpenNewMailWindowApi;

    constructor(client: ApiClient) {
        this.postAutopilotWaypointApi = new PostAutopilotWaypointApi(client);
        this.postOpenContractWindowApi = new PostOpenContractWindowApi(client);
        this.postOpenInformationWindowApi = new PostOpenInformationWindowApi(client);
        this.postOpenMarketDetailsWindowApi = new PostOpenMarketDetailsWindowApi(client);
        this.postOpenNewMailWindowApi = new PostOpenNewMailWindowApi(client);
    }

    async setAutopilotWaypoint(body: object): Promise<any> {
        return await this.postAutopilotWaypointApi.setAutopilotWaypoint(body);
    }

    async openContractWindow(body: object): Promise<any> {
        return await this.postOpenContractWindowApi.openContractWindow(body);
    }

    async openInformationWindow(body: object): Promise<any> {
        return await this.postOpenInformationWindowApi.openInformationWindow(body);
    }

    async openMarketDetailsWindow(body: object): Promise<any> {
        return await this.postOpenMarketDetailsWindowApi.openMarketDetailsWindow(body);
    }

    async openNewMailWindow(body: object): Promise<any> {
        return await this.postOpenNewMailWindowApi.openNewMailWindow(body);
    }
}
