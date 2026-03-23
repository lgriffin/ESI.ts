import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { fleetEndpoints } from '../core/endpoints/fleetEndpoints';
import { CharacterFleetInfo, FleetInfo, FleetMember, FleetWing } from '../types/api-responses';

export class FleetClient {
    private api: ReturnType<typeof createClient<typeof fleetEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, fleetEndpoints);
    }

    async getCharacterFleetInfo(characterId: number): Promise<CharacterFleetInfo> {
        return this.api.getCharacterFleetInfo(characterId);
    }

    async getFleetInformation(fleetId: number): Promise<FleetInfo> {
        return this.api.getFleetInfo(fleetId);
    }

    async updateFleet(fleetId: number, body: object): Promise<void> {
        return this.api.updateFleet(fleetId, body);
    }

    async getFleetMembers(fleetId: number): Promise<FleetMember[]> {
        return this.api.getFleetMembers(fleetId);
    }

    async createFleetInvitation(fleetId: number, body: object): Promise<void> {
        return this.api.createFleetInvitation(fleetId, body);
    }

    async kickFleetMember(fleetId: number, memberId: number): Promise<void> {
        return this.api.kickFleetMember(fleetId, memberId);
    }

    async moveFleetMember(fleetId: number, memberId: number, body: object): Promise<void> {
        return this.api.moveFleetMember(fleetId, memberId, body);
    }

    async deleteFleetSquad(fleetId: number, squadId: number): Promise<void> {
        return this.api.deleteFleetSquad(fleetId, squadId);
    }

    async renameFleetSquad(fleetId: number, squadId: number, name: string): Promise<void> {
        return this.api.renameFleetSquad(fleetId, squadId, name);
    }

    async getFleetWings(fleetId: number): Promise<FleetWing[]> {
        return this.api.getFleetWings(fleetId);
    }

    async createFleetWing(fleetId: number, body: object): Promise<{ wing_id: number }> {
        return this.api.createFleetWing(fleetId, body);
    }

    async deleteFleetWing(fleetId: number, wingId: number): Promise<void> {
        return this.api.deleteFleetWing(fleetId, wingId);
    }

    async renameFleetWing(fleetId: number, wingId: number, name: string): Promise<void> {
        return this.api.renameFleetWing(fleetId, wingId, name);
    }

    async createFleetSquad(fleetId: number, wingId: number): Promise<{ squad_id: number }> {
        return this.api.createFleetSquad(fleetId, wingId);
    }
}
