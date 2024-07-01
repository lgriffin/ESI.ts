import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseMoonByIdApi {
    constructor(private client: ApiClient) {}

    async getMoonById(moonId: number): Promise<object> {
        return handleRequest(this.client, `universe/moons/${moonId}`);
    }
}
