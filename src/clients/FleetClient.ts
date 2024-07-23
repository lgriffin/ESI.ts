import { ApiClient } from '../core/ApiClient';
import { GetCharacterFleetInfoApi } from '../api/fleets/getCharacterFleetInfo';
import { GetFleetInfoApi } from '../api/fleets/getFleetInfo';
import { UpdateFleetApi } from '../api/fleets/updateFleet';
import { GetFleetMembersApi } from '../api/fleets/getFleetMembers';
import { PostFleetInvitationApi } from '../api/fleets/postFleetInvitation';
import { DeleteFleetMemberApi } from '../api/fleets/deleteFleetMember';
import { PutFleetMemberApi } from '../api/fleets/putFleetMember';
import { DeleteFleetSquadApi } from '../api/fleets/deleteFleetSquad';
import { PutFleetSquadApi } from '../api/fleets/putFleetSquad';
import { GetFleetWingsApi } from '../api/fleets/getFleetWings';
import { PostFleetWingApi } from '../api/fleets/postFleetWing';
import { DeleteFleetWingApi } from '../api/fleets/deleteFleetWing';
import { PutFleetWingApi } from '../api/fleets/putFleetWing';
import { PostFleetSquadApi } from '../api/fleets/postFleetSquad';

export class FleetClient {
    private getCharacterFleetInfoApi: GetCharacterFleetInfoApi;
    private getFleetInformationApi: GetFleetInfoApi;
    private updateFleetApi: UpdateFleetApi;
    private getFleetMembersApi: GetFleetMembersApi;
    private postFleetInvitationApi: PostFleetInvitationApi;
    private deleteFleetMemberApi: DeleteFleetMemberApi;
    private putFleetMemberApi: PutFleetMemberApi;
    private deleteFleetSquadApi: DeleteFleetSquadApi;
    private putFleetSquadApi: PutFleetSquadApi;
    private getFleetWingsApi: GetFleetWingsApi;
    private postFleetWingApi: PostFleetWingApi;
    private deleteFleetWingApi: DeleteFleetWingApi;
    private putFleetWingApi: PutFleetWingApi;
    private postFleetSquadApi: PostFleetSquadApi;

    constructor(client: ApiClient) {
        this.getCharacterFleetInfoApi = new GetCharacterFleetInfoApi(client);
        this.getFleetInformationApi = new GetFleetInfoApi(client);
        this.updateFleetApi = new UpdateFleetApi(client);
        this.getFleetMembersApi = new GetFleetMembersApi(client);
        this.postFleetInvitationApi = new PostFleetInvitationApi(client);
        this.deleteFleetMemberApi = new DeleteFleetMemberApi(client);
        this.putFleetMemberApi = new PutFleetMemberApi(client);
        this.deleteFleetSquadApi = new DeleteFleetSquadApi(client);
        this.putFleetSquadApi = new PutFleetSquadApi(client);
        this.getFleetWingsApi = new GetFleetWingsApi(client);
        this.postFleetWingApi = new PostFleetWingApi(client);
        this.deleteFleetWingApi = new DeleteFleetWingApi(client);
        this.putFleetWingApi = new PutFleetWingApi(client);
        this.postFleetSquadApi = new PostFleetSquadApi(client);
    }

    async getCharacterFleetInfo(characterId: number): Promise<any> {
        return await this.getCharacterFleetInfoApi.getCharacterFleetInfo(characterId);
    }

    async getFleetInformation(fleetId: number): Promise<any> {
        return await this.getFleetInformationApi.getFleetInfo(fleetId);
    }

    async updateFleet(fleetId: number, body: object): Promise<any> {
        return await this.updateFleetApi.updateFleet(fleetId, body);
    }

    async getFleetMembers(fleetId: number): Promise<any> {
        return await this.getFleetMembersApi.getFleetMembers(fleetId);
    }

    async createFleetInvitation(fleetId: number, body: object): Promise<any> {
        return await this.postFleetInvitationApi.createFleetInvitation(fleetId, body);
    }

    async kickFleetMember(fleetId: number, memberId: number): Promise<any> {
        return await this.deleteFleetMemberApi.kickFleetMember(fleetId, memberId);
    }

    async moveFleetMember(fleetId: number, memberId: number, body: object): Promise<any> {
        return await this.putFleetMemberApi.moveFleetMember(fleetId, memberId, body);
    }

    async deleteFleetSquad(fleetId: number, squadId: number): Promise<any> {
        return await this.deleteFleetSquadApi.deleteFleetSquad(fleetId, squadId);
    }

    async renameFleetSquad(fleetId: number, squadId: number, name: string): Promise<any> {
        return await this.putFleetSquadApi.renameFleetSquad(fleetId, squadId, { name });
    }

    async getFleetWings(fleetId: number): Promise<any> {
        return await this.getFleetWingsApi.getFleetWings(fleetId);
    }

    async createFleetWing(fleetId: number, body: object): Promise<any> {
        return await this.postFleetWingApi.createFleetWing(fleetId, body);
    }
    
    async deleteFleetWing(fleetId: number, wingId: number): Promise<any> {
        return await this.deleteFleetWingApi.deleteFleetWing(fleetId, wingId);
    }

    async renameFleetWing(fleetId: number, wingId: number, name: string): Promise<any> {
        return await this.putFleetWingApi.renameFleetWing(fleetId, wingId, name);
    }

    async createFleetSquad(fleetId: number, wingId: number): Promise<any> {
        return await this.postFleetSquadApi.createFleetSquad(fleetId, wingId);
    }
}
