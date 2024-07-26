import { ApiClient } from '../core/ApiClient';
import { GetColoniesApi } from '../api/pi/getColonies';
import { GetColonyLayoutApi } from '../api/pi/getColonyLayout';
import { GetCorporationCustomsOfficesApi } from '../api/pi/getCorporationCustomsOffices';
import { GetSchematicInformationApi } from '../api/pi/getSchematicInformation';

export class PIClient {
    private getColoniesApi: GetColoniesApi;
    private getColonyLayoutApi: GetColonyLayoutApi;
    private getCorporationCustomsOfficesApi: GetCorporationCustomsOfficesApi;
    private getSchematicInformationApi: GetSchematicInformationApi;

    constructor(client: ApiClient) {
        this.getColoniesApi = new GetColoniesApi(client);
        this.getColonyLayoutApi = new GetColonyLayoutApi(client);
        this.getCorporationCustomsOfficesApi = new GetCorporationCustomsOfficesApi(client);
        this.getSchematicInformationApi = new GetSchematicInformationApi(client);
    }

    async getColonies(characterId: number): Promise<any> {
        return await this.getColoniesApi.getColonies(characterId);
    }

    async getColonyLayout(characterId: number, planetId: number): Promise<any> {
        return await this.getColonyLayoutApi.getColonyLayout(characterId, planetId);
    }

    async getCorporationCustomsOffices(corporationId: number): Promise<any> {
        return await this.getCorporationCustomsOfficesApi.getCorporationCustomsOffices(corporationId);
    }

    async getSchematicInformation(schematicId: number): Promise<any> {
        return await this.getSchematicInformationApi.getSchematicInformation(schematicId);
    }
}
