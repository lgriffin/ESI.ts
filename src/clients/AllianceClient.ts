import { ApiClient } from '../core/ApiClient';
import { AllianceByIdApi } from '../api/alliances/getAllianceById';
import { AllianceContactsApi } from '../api/alliances/getAllianceContacts';
import { AllianceContactLabelsApi } from '../api/alliances/getAllianceContactLabels';
import { AllianceCorporationsApi } from '../api/alliances/getAllianceCorporations';
import { AllianceIconsApi } from '../api/alliances/getAllianceIcons';
import { AllAlliancesApi } from '../api/alliances/getAlliances';
import { 
    AllianceInfo, 
    AllianceContact, 
    AllianceContactLabel, 
    AllianceIcon 
} from '../types/api-responses';
import { IApiService } from '../core/IAPIBuilder';

export class AllianceClient implements IApiService {
    readonly name = 'AllianceClient';
    readonly version = '1.0.0';
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

    async getAllianceById(allianceId: number): Promise<AllianceInfo> {
        return await this.allianceApi.getAllianceById(allianceId) as AllianceInfo;
    }

    async getContacts(allianceId: number): Promise<AllianceContact[]> {
        return await this.allianceContactsApi.getAllianceContacts(allianceId) as AllianceContact[];
    }

    async getContactLabels(allianceId: number): Promise<AllianceContactLabel[]> {
        return await this.allianceContactLabelsApi.getAllianceContactLabels(allianceId) as AllianceContactLabel[];
    }

    async getCorporations(allianceId: number): Promise<number[]> {
        return await this.allianceCorporationsApi.getAllianceCorporations(allianceId) as number[];
    }

    async getIcons(allianceId: number): Promise<AllianceIcon> {
        return await this.allianceIconsApi.getAllianceIcons(allianceId) as AllianceIcon;
    }

    async getAlliances(): Promise<number[]> {
        return await this.allAlliancesApi.getAllAlliances() as unknown as number[];
    }
}
