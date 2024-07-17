import { GetCharacterPublicInfoApi } from '../api/characters/getCharacterPublicInfo';
import { GetAgentsResearchApi } from '../api/characters/getAgentsResearch';
import { GetBlueprintsApi } from '../api/characters/getBlueprints';
import { GetCorporationHistoryApi } from '../api/characters/getCorporationHistory';
import { PostCspaChargeCostApi } from '../api/characters/postCSPAChargeCost';
import { GetJumpFatigueApi } from '../api/characters/getJumpFatigue';
import { GetMedalsApi } from '../api/characters/getMedals';
import { GetNotificationsApi } from '../api/characters/getNotifications';
import { GetContactNotificationsApi } from '../api/characters/getContactNotifications';
import { GetPortraitApi } from '../api/characters/getPortrait';
import { GetCharacterRolesApi } from '../api/characters/getCharacterRoles';
import { GetCharacterStandingsApi } from '../api/characters/getCharacterStandings';
import { GetCharacterTitlesApi } from '../api/characters/getCharacterTitles';
import { PostCharacterAffiliationApi } from '../api/characters/postCharacterAffiliations';
import { ApiClient } from '../core/ApiClient';

export class CharacterClient {
    private getCharacterPublicInfoApi: GetCharacterPublicInfoApi;
    private getCharacterAgentsResearchApi: GetAgentsResearchApi;
    private getCharacterBlueprintsApi: GetBlueprintsApi;
    private getCharacterCorporationHistoryApi: GetCorporationHistoryApi;
    private postCspaChargeCostApi: PostCspaChargeCostApi;
    private getCharacterFatigueApi: GetJumpFatigueApi;
    private getCharacterMedalsApi: GetMedalsApi;
    private getCharacterNotificationsApi: GetNotificationsApi;
    private getCharacterNotificationsContactsApi: GetContactNotificationsApi;
    private getCharacterPortraitApi: GetPortraitApi;
    private getCharacterRolesApi: GetCharacterRolesApi;
    private getCharacterStandingsApi: GetCharacterStandingsApi;
    private getCharacterTitlesApi: GetCharacterTitlesApi;
    private postCharacterAffiliationApi: PostCharacterAffiliationApi;

    constructor(client: ApiClient) {
        this.getCharacterPublicInfoApi = new GetCharacterPublicInfoApi(client);
        this.getCharacterAgentsResearchApi = new GetAgentsResearchApi(client);
        this.getCharacterBlueprintsApi = new GetBlueprintsApi(client);
        this.getCharacterCorporationHistoryApi = new GetCorporationHistoryApi(client);
        this.postCspaChargeCostApi = new PostCspaChargeCostApi(client);
        this.getCharacterFatigueApi = new GetJumpFatigueApi(client);
        this.getCharacterMedalsApi = new GetMedalsApi(client);
        this.getCharacterNotificationsApi = new GetNotificationsApi(client);
        this.getCharacterNotificationsContactsApi = new GetContactNotificationsApi(client);
        this.getCharacterPortraitApi = new GetPortraitApi(client);
        this.getCharacterRolesApi = new GetCharacterRolesApi(client);
        this.getCharacterStandingsApi = new GetCharacterStandingsApi(client);
        this.getCharacterTitlesApi = new GetCharacterTitlesApi(client);
        this.postCharacterAffiliationApi = new PostCharacterAffiliationApi(client);
    }

    async getCharacterPublicInfo(characterId: number): Promise<any> {
        return await this.getCharacterPublicInfoApi.getCharacterPublicInfo(characterId);
    }

    async getCharacterAgentsResearch(characterId: number): Promise<any> {
        return await this.getCharacterAgentsResearchApi.getAgentsResearch(characterId);
    }

    async getCharacterBlueprints(characterId: number): Promise<any> {
        return await this.getCharacterBlueprintsApi.getBlueprints(characterId);
    }

    async getCharacterCorporationHistory(characterId: number): Promise<any> {
        return await this.getCharacterCorporationHistoryApi.getCorporationHistory(characterId);
    }

    async postCspaChargeCost(characterId: number, characters: number[]): Promise<any> {
        return await this.postCspaChargeCostApi.calculateCspaChargeCost(characterId, characters);
    }

    async getCharacterFatigue(characterId: number): Promise<any> {
        return await this.getCharacterFatigueApi.getJumpFatigue(characterId);
    }

    async getCharacterMedals(characterId: number): Promise<any> {
        return await this.getCharacterMedalsApi.getMedals(characterId);
    }

    async getCharacterNotifications(characterId: number): Promise<any> {
        return await this.getCharacterNotificationsApi.getNotifications(characterId);
    }

    async getCharacterNotificationsContacts(characterId: number): Promise<any> {
        return await this.getCharacterNotificationsContactsApi.getContactNotifications(characterId);
    }

    async getCharacterPortrait(characterId: number): Promise<any> {
        return await this.getCharacterPortraitApi.getPortrait(characterId);
    }

    async getCharacterRoles(characterId: number): Promise<any> {
        return await this.getCharacterRolesApi.getCharacterRoles(characterId);
    }

    async getCharacterStandings(characterId: number): Promise<any> {
        return await this.getCharacterStandingsApi.getCharacterStandings(characterId);
    }

    async getCharacterTitles(characterId: number): Promise<any> {
        return await this.getCharacterTitlesApi.getCharacterTitles(characterId);
    }

    async postCharacterAffiliation(characters: number[]): Promise<any> {
        return await this.postCharacterAffiliationApi.postCharacterAffiliation(characters);
    }
}
