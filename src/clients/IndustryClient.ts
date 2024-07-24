import { GetCharacterIndustryJobsApi } from '../api/industry/getCharacterIndustryJobs';
import { GetCharacterMiningLedgerApi } from '../api/industry/getCharacterMiningLedger';
import { GetMoonExtractionTimersApi } from '../api/industry/getMoonExtractionTimers';
import { GetCorporationMiningObserversApi } from '../api/industry/getCorporationMiningObservers';
import { GetCorporationMiningObserverApi } from '../api/industry/getCorporationMiningObserver';
import { GetCorporationIndustryJobsApi } from '../api/industry/getCorporationIndustryJobs';
import { GetIndustryFacilitiesApi } from '../api/industry/getIndustryFacilities';
import { GetIndustrySystemsApi } from '../api/industry/getIndustrySystems';
import { ApiClient } from '../core/ApiClient';

export class IndustryClient {
    private getCharacterIndustryJobsApi: GetCharacterIndustryJobsApi;
    private getCharacterMiningLedgerApi: GetCharacterMiningLedgerApi;
    private getMoonExtractionTimersApi: GetMoonExtractionTimersApi;
    private getCorporationMiningObserversApi: GetCorporationMiningObserversApi;
    private getCorporationMiningObserverApi: GetCorporationMiningObserverApi;
    private getCorporationIndustryJobsApi: GetCorporationIndustryJobsApi;
    private getIndustryFacilitiesApi: GetIndustryFacilitiesApi;
    private getIndustrySystemsApi: GetIndustrySystemsApi;

    constructor(client: ApiClient) {
        this.getCharacterIndustryJobsApi = new GetCharacterIndustryJobsApi(client);
        this.getCharacterMiningLedgerApi = new GetCharacterMiningLedgerApi(client);
        this.getMoonExtractionTimersApi = new GetMoonExtractionTimersApi(client);
        this.getCorporationMiningObserversApi = new GetCorporationMiningObserversApi(client);
        this.getCorporationMiningObserverApi = new GetCorporationMiningObserverApi(client);
        this.getCorporationIndustryJobsApi = new GetCorporationIndustryJobsApi(client);
        this.getIndustryFacilitiesApi = new GetIndustryFacilitiesApi(client);
        this.getIndustrySystemsApi = new GetIndustrySystemsApi(client);
    }

    async getCharacterIndustryJobs(characterId: number): Promise<any> {
        return await this.getCharacterIndustryJobsApi.getCharacterIndustryJobs(characterId);
    }

    async getCharacterMiningLedger(characterId: number): Promise<any> {
        return await this.getCharacterMiningLedgerApi.getCharacterMiningLedger(characterId);
    }

    async getMoonExtractionTimers(corporationId: number): Promise<any> {
        return await this.getMoonExtractionTimersApi.getMoonExtractionTimers(corporationId);
    }

    async getCorporationMiningObservers(corporationId: number): Promise<any> {
        return await this.getCorporationMiningObserversApi.getCorporationMiningObservers(corporationId);
    }

    async getCorporationMiningObserver(corporationId: number, observerId: number): Promise<any> {
        return await this.getCorporationMiningObserverApi.getCorporationMiningObserver(corporationId, observerId);
    }

    async getCorporationIndustryJobs(corporationId: number): Promise<any> {
        return await this.getCorporationIndustryJobsApi.getCorporationIndustryJobs(corporationId);
    }

    async getIndustryFacilities(): Promise<any> {
        return await this.getIndustryFacilitiesApi.getIndustryFacilities();
    }

    async getIndustrySystems(): Promise<any> {
        return await this.getIndustrySystemsApi.getIndustrySystems();
    }
}
