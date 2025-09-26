import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostJumpCloneActivationApi {
    constructor(private client: ApiClient) {}

    async activateJumpClone(characterId: number, jumpCloneId: number): Promise<any> {
        const body = JSON.stringify({ jump_clone_id: jumpCloneId });
        return handleRequest(this.client, `characters/${characterId}/clones`, 'POST', body, true);
    }
}
