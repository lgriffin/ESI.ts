import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { freelanceJobsEndpoints } from '../core/endpoints/freelanceJobsEndpoints';
import { FreelanceJobsListing, FreelanceJobDetail } from '../types/api-responses';

export class FreelanceJobsClient {
    private api: ReturnType<typeof createClient<typeof freelanceJobsEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, freelanceJobsEndpoints);
    }

    async getFreelanceJobs(before?: string, after?: string): Promise<FreelanceJobsListing> {
        return this.api.getFreelanceJobs(before, after);
    }

    async getFreelanceJobById(jobId: string): Promise<FreelanceJobDetail> {
        return this.api.getFreelanceJobById(jobId);
    }

    async getCharacterFreelanceJobs(characterId: number, before?: string, after?: string): Promise<any> {
        return this.api.getCharacterFreelanceJobs(characterId, before, after);
    }

    async getCharacterFreelanceJobParticipation(characterId: number, jobId: string): Promise<any> {
        return this.api.getCharacterFreelanceJobParticipation(characterId, jobId);
    }

    async getCorporationFreelanceJobs(corporationId: number, before?: string, after?: string): Promise<any> {
        return this.api.getCorporationFreelanceJobs(corporationId, before, after);
    }

    async getCorporationFreelanceJobParticipants(corporationId: number, jobId: string): Promise<any> {
        return this.api.getCorporationFreelanceJobParticipants(corporationId, jobId);
    }
}
