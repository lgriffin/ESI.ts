import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { allianceEndpoints } from '../core/endpoints/allianceEndpoints';
import { AllianceInfo, AllianceContact, AllianceContactLabel, AllianceIcon } from '../types/api-responses';

export class AllianceClient {
    private api: ReturnType<typeof createClient<typeof allianceEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, allianceEndpoints);
    }

    async getAllianceById(allianceId: number): Promise<AllianceInfo> {
        return this.api.getAllianceById(allianceId);
    }

    async getContacts(allianceId: number): Promise<AllianceContact[]> {
        return this.api.getContacts(allianceId);
    }

    async getContactLabels(allianceId: number): Promise<AllianceContactLabel[]> {
        return this.api.getContactLabels(allianceId);
    }

    async getCorporations(allianceId: number): Promise<number[]> {
        return this.api.getCorporations(allianceId);
    }

    async getIcons(allianceId: number): Promise<AllianceIcon> {
        return this.api.getIcons(allianceId);
    }

    async getAlliances(): Promise<number[]> {
        return this.api.getAlliances();
    }
}
