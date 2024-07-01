import { ApiClient } from '../../core/ApiClient';
import { AllianceByIdApi } from './getAllianceById';
import { AllianceContactsApi } from './getAllianceContacts';
import { AllianceContactLabelsApi } from './getAllianceContactLabels';
import { AllianceCorporationsApi } from './getAllianceCorporations';
import { AllianceIconsApi } from './getAllianceIcons';
import { AllAlliancesApi } from './getAlliances';

export class AllianceClient {
    private allianceApi: AllianceByIdApi;
    private allianceContactsApi: AllianceContactsApi;
    private allianceContactLabelsApi: AllianceContactLabelsApi;
    private allianceCorporationsApi: AllianceCorporationsApi;
    private allianceIconsApi: AllianceIconsApi;
    private allAlliancesApi: AllAlliancesApi;

    constructor(client: ApiClient) {
        this.allianceApi = new AllianceByIdApi(client);
        this.allianceContactsApi = new AllianceContactsApi(client);
        this.allianceContactLabelsApi = new AllianceContactLabelsApi(client);
        this.allianceCorporationsApi = new AllianceCorporationsApi(client);
        this.allianceIconsApi = new AllianceIconsApi(client);
        this.allAlliancesApi = new AllAlliancesApi(client);
    }

    async getAllianceById(allianceId: number): Promise<any> {
        return await this.allianceApi.getAllianceById(allianceId);
    }

    async getContacts(allianceId: number): Promise<any> {
        return await this.allianceContactsApi.getAllianceContacts(allianceId);
    }

    async getContactLabels(allianceId: number): Promise<any> {
        return await this.allianceContactLabelsApi.getAllianceContactLabels(allianceId);
    }

    async getCorporations(allianceId: number): Promise<any> {
        return await this.allianceCorporationsApi.getAllianceCorporations(allianceId);
    }

    async getIcons(allianceId: number): Promise<any> {
        return await this.allianceIconsApi.getAllianceIcons(allianceId);
    }

    async getAlliances(): Promise<any> {
        return await this.allAlliancesApi.getAllAlliances();
    }
}
