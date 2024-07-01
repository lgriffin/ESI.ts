import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseStationByIdApi {
    constructor(private client: ApiClient) {}

    async getStationById(stationId: number): Promise<object> {
        return handleRequest(this.client, `universe/stations/${stationId}`);
    }
}
