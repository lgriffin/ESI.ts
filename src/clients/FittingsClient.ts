import { ApiClient } from '../core/ApiClient';
import { GetCharacterFittingsApi } from '../api/fittings/getCharacterFittings';
import { PostCharacterFittingApi } from '../api/fittings/postCharacterFittings';
import { DeleteCharacterFittingApi } from '../api/fittings/deleteCharacterFitting';

export class FittingsClient {
    private getCharacterFittingsApi: GetCharacterFittingsApi;
    private postCharacterFittingApi: PostCharacterFittingApi;
    private deleteCharacterFittingApi: DeleteCharacterFittingApi;

    constructor(client: ApiClient) {
        this.getCharacterFittingsApi = new GetCharacterFittingsApi(client);
        this.postCharacterFittingApi = new PostCharacterFittingApi(client);
        this.deleteCharacterFittingApi = new DeleteCharacterFittingApi(client);
    }

    async getFittings(characterId: number): Promise<any> {
        return await this.getCharacterFittingsApi.getFittings(characterId);
    }

    async createFitting(characterId: number, fittingData: object): Promise<any> {
        return await this.postCharacterFittingApi.createFitting(characterId, fittingData);
    }

    async deleteFitting(characterId: number, fittingId: number): Promise<any> {
        return await this.deleteCharacterFittingApi.deleteFitting(characterId, fittingId);
    }
}
