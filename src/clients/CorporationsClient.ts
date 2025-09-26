import { ApiClient } from '../core/ApiClient';
import { GetCorporationInfoApi } from '../api/corporations/getCorporationInfo';
import { GetCorporationAllianceHistoryApi } from '../api/corporations/getCorporationAllianceHistory';
import { GetCorporationBlueprintsApi } from '../api/corporations/getCorporationBlueprints';
import { GetCorporationAlscLogsApi } from '../api/corporations/getCorporationAlscLogs';
import { GetCorporationDivisionsApi } from '../api/corporations/getCorporationDivisions';
import { GetCorporationFacilitiesApi } from '../api/corporations/getCorporationFacilities';
import { GetCorporationIconApi } from '../api/corporations/getCorporationIcon';
import { GetCorporationMedalsApi } from '../api/corporations/getCorporationMedals';
import { GetCorporationIssuedMedalsApi } from '../api/corporations/getCorporationIssuedMedals';
import { GetCorporationMembersApi } from '../api/corporations/getCorporationMembers';
import { GetCorporationMemberLimitApi } from '../api/corporations/getCorporationMemberLimit';
import { GetCorporationMembersTitlesApi } from '../api/corporations/getCorporationMembersTitles';
import { GetCorporationMemberTrackingApi } from '../api/corporations/getCorporationMemberTracking';
import { GetCorporationMemberRolesApi } from '../api/corporations/getCorporationMemberRoles';
import { GetCorporationMemberRolesHistoryApi } from '../api/corporations/getCorporationMemberRolesHistory';
import { GetCorporationShareholdersApi } from '../api/corporations/getCorporationShareholders';
import { GetCorporationStandingsApi } from '../api/corporations/getCorporationStandings';
import { GetCorporationStarbasesApi } from '../api/corporations/getCorporationStarbases';
import { GetCorporationStarbaseDetailApi } from '../api/corporations/getCorporationStarbaseDetail';
import { GetCorporationStructuresApi } from '../api/corporations/getCorporationStructures';
import { GetCorporationTitlesApi } from '../api/corporations/getCorporationTitles';
import { GetNpcCorporationsApi } from '../api/corporations/getNpcCorporations';
import { GetCorporationProjectsApi } from '../api/corporations/getCorporationProjects';

export class CorporationsClient {
    private getCorporationInfoApi: GetCorporationInfoApi;
    private getCorporationAllianceHistoryApi: GetCorporationAllianceHistoryApi;
    private getCorporationBlueprintsApi: GetCorporationBlueprintsApi;
    private getCorporationAlscLogsApi: GetCorporationAlscLogsApi;
    private getCorporationDivisionsApi: GetCorporationDivisionsApi;
    private getCorporationFacilitiesApi: GetCorporationFacilitiesApi;
    private getCorporationIconApi: GetCorporationIconApi;
    private getCorporationMedalsApi: GetCorporationMedalsApi;
    private getCorporationIssuedMedalsApi: GetCorporationIssuedMedalsApi;
    private getCorporationMembersApi: GetCorporationMembersApi;
    private getCorporationMemberLimitApi: GetCorporationMemberLimitApi;
    private getCorporationMemberTitlesApi: GetCorporationMembersTitlesApi;
    private getCorporationMemberTrackingApi: GetCorporationMemberTrackingApi;
    private getCorporationRolesApi: GetCorporationMemberRolesApi;
    private getCorporationRolesHistoryApi: GetCorporationMemberRolesHistoryApi;
    private getCorporationShareholdersApi: GetCorporationShareholdersApi;
    private getCorporationStandingsApi: GetCorporationStandingsApi;
    private getCorporationStarbasesApi: GetCorporationStarbasesApi;
    private getCorporationStarbaseDetailApi: GetCorporationStarbaseDetailApi;
    private getCorporationStructuresApi: GetCorporationStructuresApi;
    private getCorporationTitlesApi: GetCorporationTitlesApi;
    private getNpcCorporationsApi: GetNpcCorporationsApi;
    private getCorporationProjectsApi: GetCorporationProjectsApi;

    constructor(client: ApiClient) {
        this.getCorporationInfoApi = new GetCorporationInfoApi(client);
        this.getCorporationAllianceHistoryApi = new GetCorporationAllianceHistoryApi(client);
        this.getCorporationBlueprintsApi = new GetCorporationBlueprintsApi(client);
        this.getCorporationAlscLogsApi = new GetCorporationAlscLogsApi(client);
        this.getCorporationDivisionsApi = new GetCorporationDivisionsApi(client);
        this.getCorporationFacilitiesApi = new GetCorporationFacilitiesApi(client);
        this.getCorporationIconApi = new GetCorporationIconApi(client);
        this.getCorporationMedalsApi = new GetCorporationMedalsApi(client);
        this.getCorporationIssuedMedalsApi = new GetCorporationIssuedMedalsApi(client);
        this.getCorporationMembersApi = new GetCorporationMembersApi(client);
        this.getCorporationMemberLimitApi = new GetCorporationMemberLimitApi(client);
        this.getCorporationMemberTitlesApi = new GetCorporationMembersTitlesApi(client);
        this.getCorporationMemberTrackingApi = new GetCorporationMemberTrackingApi(client);
        this.getCorporationRolesApi = new GetCorporationMemberRolesApi(client);
        this.getCorporationRolesHistoryApi = new GetCorporationMemberRolesHistoryApi(client);
        this.getCorporationShareholdersApi = new GetCorporationShareholdersApi(client);
        this.getCorporationStandingsApi = new GetCorporationStandingsApi(client);
        this.getCorporationStarbasesApi = new GetCorporationStarbasesApi(client);
        this.getCorporationStarbaseDetailApi = new GetCorporationStarbaseDetailApi(client);
        this.getCorporationStructuresApi = new GetCorporationStructuresApi(client);
        this.getCorporationTitlesApi = new GetCorporationTitlesApi(client);
        this.getNpcCorporationsApi = new GetNpcCorporationsApi(client);
        this.getCorporationProjectsApi = new GetCorporationProjectsApi(client);
    }

    async getCorporationInfo(corporationId: number): Promise<any> {
        return await this.getCorporationInfoApi.getCorporationInfo(corporationId);
    }

    async getCorporationAllianceHistory(corporationId: number): Promise<any> {
        return await this.getCorporationAllianceHistoryApi.getCorporationAllianceHistory(corporationId);
    }

    async getCorporationBlueprints(corporationId: number): Promise<any> {
        return await this.getCorporationBlueprintsApi.getCorporationBlueprints(corporationId);
    }

    async getCorporationAlscLogs(corporationId: number): Promise<any> {
        return await this.getCorporationAlscLogsApi.getCorporationAlscLogs(corporationId);
    }

    async getCorporationDivisions(corporationId: number): Promise<any> {
        return await this.getCorporationDivisionsApi.getCorporationDivisions(corporationId);
    }

    async getCorporationFacilities(corporationId: number): Promise<any> {
        return await this.getCorporationFacilitiesApi.getCorporationFacilities(corporationId);
    }

    async getCorporationIcon(corporationId: number): Promise<any> {
        return await this.getCorporationIconApi.getCorporationIcon(corporationId);
    }

    async getCorporationMedals(corporationId: number): Promise<any> {
        return await this.getCorporationMedalsApi.getCorporationMedals(corporationId);
    }

    async getCorporationIssuedMedals(corporationId: number): Promise<any> {
        return await this.getCorporationIssuedMedalsApi.getCorporationIssuedMedals(corporationId);
    }

    async getCorporationMembers(corporationId: number): Promise<any> {
        return await this.getCorporationMembersApi.getCorporationMembers(corporationId);
    }

    async getCorporationMemberLimit(corporationId: number): Promise<any> {
        return await this.getCorporationMemberLimitApi.getCorporationMemberLimit(corporationId);
    }

    async getCorporationMemberTitles(corporationId: number): Promise<any> {
        return await this.getCorporationMemberTitlesApi.getCorporationMembersTitles(corporationId);
    }

    async getCorporationMemberTracking(corporationId: number): Promise<any> {
        return await this.getCorporationMemberTrackingApi.getCorporationMemberTracking(corporationId);
    }

    async getCorporationRoles(corporationId: number): Promise<any> {
        return await this.getCorporationRolesApi.getCorporationMemberRoles(corporationId);
    }

    async getCorporationRolesHistory(corporationId: number): Promise<any> {
        return await this.getCorporationRolesHistoryApi.getCorporationMemberRolesHistory(corporationId);
    }

    async getCorporationShareholders(corporationId: number): Promise<any> {
        return await this.getCorporationShareholdersApi.getCorporationShareholders(corporationId);
    }

    async getCorporationStandings(corporationId: number): Promise<any> {
        return await this.getCorporationStandingsApi.getCorporationStandings(corporationId);
    }

    async getCorporationStarbases(corporationId: number): Promise<any> {
        return await this.getCorporationStarbasesApi.getCorporationStarbases(corporationId);
    }

    async getCorporationStarbaseDetail(corporationId: number, starbaseId: number): Promise<any> {
        return await this.getCorporationStarbaseDetailApi.getCorporationStarbaseDetail(corporationId, starbaseId);
    }

    async getCorporationStructures(corporationId: number): Promise<any> {
        return await this.getCorporationStructuresApi.getCorporationStructures(corporationId);
    }

    async getCorporationTitles(corporationId: number): Promise<any> {
        return await this.getCorporationTitlesApi.getCorporationTitles(corporationId);
    }

    async getNpcCorporations(): Promise<any> {
        return await this.getNpcCorporationsApi.getNpcCorporations();
    }

    async getCorporationProjects(corporationId: number): Promise<any> {
        return await this.getCorporationProjectsApi.getCorporationProjects(corporationId);
    }
}
