import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { fittingEndpoints } from '../core/endpoints/fittingEndpoints';
import { Fitting } from '../types/api-responses';

export class FittingsClient {
    private api: ReturnType<typeof createClient<typeof fittingEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, fittingEndpoints);
    }

    async getFittings(characterId: number): Promise<Fitting[]> {
        return this.api.getFittings(characterId);
    }

    async createFitting(characterId: number, fittingData: object): Promise<{ fitting_id: number }> {
        return this.api.createFitting(characterId, fittingData);
    }

    async deleteFitting(characterId: number, fittingId: number): Promise<void> {
        return this.api.deleteFitting(characterId, fittingId);
    }
}
