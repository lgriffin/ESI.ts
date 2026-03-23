import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { characterEndpoints } from '../core/endpoints/characterEndpoints';
import { CharacterInfo, CharacterPortrait, AgentResearch, Blueprint, CorporationHistory, JumpFatigue, Medal, Notification, Standing, CharacterTitle, CharacterAffiliation, CharacterRole } from '../types/api-responses';

export class CharacterClient {
    private api: ReturnType<typeof createClient<typeof characterEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, characterEndpoints);
    }

    async getCharacterPublicInfo(characterId: number): Promise<CharacterInfo> {
        return this.api.getCharacterPublicInfo(characterId);
    }

    async getCharacterAgentsResearch(characterId: number): Promise<AgentResearch[]> {
        return this.api.getAgentsResearch(characterId);
    }

    async getCharacterBlueprints(characterId: number): Promise<Blueprint[]> {
        return this.api.getBlueprints(characterId);
    }

    async getCharacterCorporationHistory(characterId: number): Promise<CorporationHistory[]> {
        return this.api.getCorporationHistory(characterId);
    }

    async postCspaChargeCost(characterId: number, characters: number[]): Promise<number> {
        return this.api.calculateCspaChargeCost(characterId, characters);
    }

    async getCharacterFatigue(characterId: number): Promise<JumpFatigue> {
        return this.api.getJumpFatigue(characterId);
    }

    async getCharacterMedals(characterId: number): Promise<Medal[]> {
        return this.api.getMedals(characterId);
    }

    async getCharacterNotifications(characterId: number): Promise<Notification[]> {
        return this.api.getNotifications(characterId);
    }

    async getCharacterNotificationsContacts(characterId: number): Promise<Notification[]> {
        return this.api.getContactNotifications(characterId);
    }

    async getCharacterPortrait(characterId: number): Promise<CharacterPortrait> {
        return this.api.getPortrait(characterId);
    }

    async getCharacterRoles(characterId: number): Promise<CharacterRole> {
        return this.api.getRoles(characterId);
    }

    async getCharacterStandings(characterId: number): Promise<Standing[]> {
        return this.api.getStandings(characterId);
    }

    async getCharacterTitles(characterId: number): Promise<CharacterTitle[]> {
        return this.api.getTitles(characterId);
    }

    async postCharacterAffiliation(characters: number[]): Promise<CharacterAffiliation[]> {
        return this.api.postCharacterAffiliation(characters);
    }
}
