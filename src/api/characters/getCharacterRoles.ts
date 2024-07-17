import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterRolesApi {
    constructor(private client: ApiClient) {}

    async getCharacterRoles(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/roles`, 'GET', undefined, true);
    }
}
