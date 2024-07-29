import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class DeleteCharacterMailLabelApi {
    constructor(private client: ApiClient) {}

    async deleteMailLabel(characterId: number, labelId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mail/labels/${labelId}/`, 'DELETE', undefined, true);
    }
}
