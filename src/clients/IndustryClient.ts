import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { industryEndpoints } from '../core/endpoints/industryEndpoints';
import { IndustryJob, MiningLedgerEntry, IndustryFacility, IndustrySystem } from '../types/api-responses';

export class IndustryClient {
    private api: ReturnType<typeof createClient<typeof industryEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, industryEndpoints);
    }

    async getCharacterIndustryJobs(characterId: number): Promise<IndustryJob[]> {
        return this.api.getCharacterIndustryJobs(characterId);
    }

    async getCharacterMiningLedger(characterId: number): Promise<MiningLedgerEntry[]> {
        return this.api.getCharacterMiningLedger(characterId);
    }

    async getMoonExtractionTimers(corporationId: number): Promise<any> {
        return this.api.getMoonExtractionTimers(corporationId);
    }

    async getCorporationMiningObservers(corporationId: number): Promise<any> {
        return this.api.getCorporationMiningObservers(corporationId);
    }

    async getCorporationMiningObserver(corporationId: number, observerId: number): Promise<any> {
        return this.api.getCorporationMiningObserver(corporationId, observerId);
    }

    async getCorporationIndustryJobs(corporationId: number): Promise<IndustryJob[]> {
        return this.api.getCorporationIndustryJobs(corporationId);
    }

    async getIndustryFacilities(): Promise<IndustryFacility[]> {
        return this.api.getIndustryFacilities();
    }

    async getIndustrySystems(): Promise<IndustrySystem[]> {
        return this.api.getIndustrySystems();
    }
}
