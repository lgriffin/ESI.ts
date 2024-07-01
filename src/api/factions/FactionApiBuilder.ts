import { ApiClient } from '../../core/ApiClient';
import { FactionWarfareLeaderboardsApi } from './getFactionWarfareLeaderboards';
import { FactionWarfareStatsApi } from './getFactionWarfareStats';
import { FactionWarfareSystemsApi } from './getFactionWarfareSystems';
import { FactionWarfareWarsApi } from './getFactionWarfareWars';
import { FactionClient } from './FactionClient'; // Ensure this import is correct

export class FactionAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): FactionClient {
        return new FactionClient(
            new FactionWarfareLeaderboardsApi(this.client),
            new FactionWarfareStatsApi(this.client),
            new FactionWarfareSystemsApi(this.client),
            new FactionWarfareWarsApi(this.client)
        );
    }
}
