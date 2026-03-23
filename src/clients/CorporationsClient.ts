import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { corporationEndpoints } from '../core/endpoints/corporationEndpoints';
import { CorporationInfo, CorporationAllianceHistory, CorporationMedal, CorporationStarbase, Standing } from '../types/api-responses';

export class CorporationsClient {
    private api: ReturnType<typeof createClient<typeof corporationEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, corporationEndpoints);
    }

    async getCorporationInfo(corporationId: number): Promise<CorporationInfo> {
        return this.api.getCorporationInfo(corporationId);
    }

    async getCorporationAllianceHistory(corporationId: number): Promise<CorporationAllianceHistory[]> {
        return this.api.getCorporationAllianceHistory(corporationId);
    }

    async getCorporationBlueprints(corporationId: number): Promise<any> {
        return this.api.getCorporationBlueprints(corporationId);
    }

    async getCorporationAlscLogs(corporationId: number): Promise<any> {
        return this.api.getCorporationAlscLogs(corporationId);
    }

    async getCorporationDivisions(corporationId: number): Promise<any> {
        return this.api.getCorporationDivisions(corporationId);
    }

    async getCorporationFacilities(corporationId: number): Promise<any> {
        return this.api.getCorporationFacilities(corporationId);
    }

    async getCorporationIcon(corporationId: number): Promise<{ px64x64?: string; px128x128?: string; px256x256?: string }> {
        return this.api.getCorporationIcon(corporationId);
    }

    async getCorporationMedals(corporationId: number): Promise<CorporationMedal[]> {
        return this.api.getCorporationMedals(corporationId);
    }

    async getCorporationIssuedMedals(corporationId: number): Promise<any> {
        return this.api.getCorporationIssuedMedals(corporationId);
    }

    async getCorporationMembers(corporationId: number): Promise<number[]> {
        return this.api.getCorporationMembers(corporationId);
    }

    async getCorporationMemberLimit(corporationId: number): Promise<number> {
        return this.api.getCorporationMemberLimit(corporationId);
    }

    async getCorporationMemberTitles(corporationId: number): Promise<any> {
        return this.api.getCorporationMembersTitles(corporationId);
    }

    async getCorporationMemberTracking(corporationId: number): Promise<any> {
        return this.api.getCorporationMemberTracking(corporationId);
    }

    async getCorporationRoles(corporationId: number): Promise<any> {
        return this.api.getCorporationMemberRoles(corporationId);
    }

    async getCorporationRolesHistory(corporationId: number): Promise<any> {
        return this.api.getCorporationMemberRolesHistory(corporationId);
    }

    async getCorporationShareholders(corporationId: number): Promise<any> {
        return this.api.getCorporationShareholders(corporationId);
    }

    async getCorporationStandings(corporationId: number): Promise<Standing[]> {
        return this.api.getCorporationStandings(corporationId);
    }

    async getCorporationStarbases(corporationId: number): Promise<CorporationStarbase[]> {
        return this.api.getCorporationStarbases(corporationId);
    }

    async getCorporationStarbaseDetail(corporationId: number, starbaseId: number): Promise<any> {
        return this.api.getCorporationStarbaseDetail(corporationId, starbaseId);
    }

    async getCorporationStructures(corporationId: number): Promise<any> {
        return this.api.getCorporationStructures(corporationId);
    }

    async getCorporationTitles(corporationId: number): Promise<any> {
        return this.api.getCorporationTitles(corporationId);
    }

    async getNpcCorporations(): Promise<number[]> {
        return this.api.getNpcCorporations();
    }
}
