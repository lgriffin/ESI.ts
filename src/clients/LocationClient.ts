import { ApiClient } from '../core/ApiClient';
import { GetCharacterLocationApi } from '../api/location/getCharacterLocation';
import { GetCharacterOnlineApi } from '../api/location/getCharacterOnline';
import { GetCharacterShipApi } from '../api/location/getCharacterShip';

export class LocationClient {
    private getCharacterLocationApi: GetCharacterLocationApi;
    private getCharacterOnlineApi: GetCharacterOnlineApi;
    private getCharacterShipApi: GetCharacterShipApi;

    constructor(client: ApiClient) {
        this.getCharacterLocationApi = new GetCharacterLocationApi(client);
        this.getCharacterOnlineApi = new GetCharacterOnlineApi(client);
        this.getCharacterShipApi = new GetCharacterShipApi(client);
    }

    async getCharacterLocation(characterId: number): Promise<any> {
        return await this.getCharacterLocationApi.getCharacterLocation(characterId);
    }

    async getCharacterOnline(characterId: number): Promise<any> {
        return await this.getCharacterOnlineApi.getCharacterOnline(characterId);
    }

    async getCharacterShip(characterId: number): Promise<any> {
        return await this.getCharacterShipApi.getCharacterShip(characterId);
    }
}
