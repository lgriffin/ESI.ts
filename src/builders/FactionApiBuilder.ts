import { ApiClient } from '../core/ApiClient';
import { FactionWarfareLeaderboardsApi } from '../api/factions/getFactionWarfareLeaderboards';
import { FactionWarfareStatsApi } from '../api/factions/getFactionWarfareStats';
import { FactionWarfareSystemsApi } from '../api/factions/getFactionWarfareSystems';
import { FactionWarfareWarsApi } from '../api/factions/getFactionWarfareWars';
import { FactionClient } from '../clients/FactionClient'; // Ensure this import is correct

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
