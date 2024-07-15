import { ApiClient } from '../core/ApiClient';
import { GetCharacterOpportunitiesApi } from '../api/opportunities/getCharacterOpportunities';
import { GetOpportunitiesGroupsApi } from '../api/opportunities/getOpportunitiesGroups';
import { GetOpportunitiesGroupByIdApi } from '../api/opportunities/getOpportunitiesGroupById';
import { GetOpportunitiesTasksApi } from '../api/opportunities/getOpportunitiesTasks';
import { GetOpportunitiesTaskByIdApi } from '../api/opportunities/getOpportunitiesTaskById';

export class OpportunitiesClient {
    private getCharacterOpportunitiesApi: GetCharacterOpportunitiesApi;
    private getOpportunitiesGroupsApi: GetOpportunitiesGroupsApi;
    private getOpportunitiesGroupByIdApi: GetOpportunitiesGroupByIdApi;
    private getOpportunitiesTasksApi: GetOpportunitiesTasksApi;
    private getOpportunitiesTaskByIdApi: GetOpportunitiesTaskByIdApi;

    constructor(client: ApiClient) {
        this.getCharacterOpportunitiesApi = new GetCharacterOpportunitiesApi(client);
        this.getOpportunitiesGroupsApi = new GetOpportunitiesGroupsApi(client);
        this.getOpportunitiesGroupByIdApi = new GetOpportunitiesGroupByIdApi(client);
        this.getOpportunitiesTasksApi = new GetOpportunitiesTasksApi(client);
        this.getOpportunitiesTaskByIdApi = new GetOpportunitiesTaskByIdApi(client);
    }

    async getCharacterOpportunities(characterId: number): Promise<any> {
        return await this.getCharacterOpportunitiesApi.getCharacterOpportunities(characterId);
    }

    async getOpportunitiesGroups(): Promise<any> {
        return await this.getOpportunitiesGroupsApi.getOpportunitiesGroups();
    }

    async getOpportunitiesGroupById(groupId: number): Promise<any> {
        return await this.getOpportunitiesGroupByIdApi.getOpportunitiesGroupById(groupId);
    }

    async getOpportunitiesTasks(): Promise<any> {
        return await this.getOpportunitiesTasksApi.getOpportunitiesTasks();
    }

    async getOpportunitiesTaskById(taskId: number): Promise<any> {
        return await this.getOpportunitiesTaskByIdApi.getOpportunitiesTaskById(taskId);
    }
}
