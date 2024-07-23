import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DeleteCharacterFittingApi {
    constructor(private client: ApiClient) {}

    async deleteFitting(characterId: number, fittingId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/fittings/${fittingId}`, 'DELETE', undefined, true);
    }
}
