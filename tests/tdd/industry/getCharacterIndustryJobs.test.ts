import { GetCharacterIndustryJobsApi } from '../../../src/api/industry/getCharacterIndustryJobs';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterIndustryJobsApi = new GetCharacterIndustryJobsApi(client);

describe('GetCharacterIndustryJobsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character industry jobs', async () => {
        const mockResponse = [
            {
                job_id: 1,
                activity_id: 3,
                blueprint_id: 2,
                blueprint_location_id: 3,
                blueprint_type_id: 4,
                cost: 500,
                end_date: '2024-01-01T00:00:00Z',
                facility_id: 5,
                installer_id: 6,
                licensed_runs: 1,
                location_id: 7,
                output_location_id: 8,
                probability: 0.9,
                product_type_id: 9,
                runs: 1,
                start_date: '2024-01-01T00:00:00Z',
                status: 'active'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await characterIndustryJobsApi.getCharacterIndustryJobs(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((job: any) => {
            expect(job).toHaveProperty('job_id');
            expect(typeof job.job_id).toBe('number');
            expect(job).toHaveProperty('activity_id');
            expect(typeof job.activity_id).toBe('number');
            expect(job).toHaveProperty('blueprint_id');
            expect(typeof job.blueprint_id).toBe('number');
            expect(job).toHaveProperty('blueprint_location_id');
            expect(typeof job.blueprint_location_id).toBe('number');
            expect(job).toHaveProperty('blueprint_type_id');
            expect(typeof job.blueprint_type_id).toBe('number');
            expect(job).toHaveProperty('cost');
            expect(typeof job.cost).toBe('number');
            expect(job).toHaveProperty('end_date');
            expect(typeof job.end_date).toBe('string');
            expect(job).toHaveProperty('facility_id');
            expect(typeof job.facility_id).toBe('number');
            expect(job).toHaveProperty('installer_id');
            expect(typeof job.installer_id).toBe('number');
            expect(job).toHaveProperty('licensed_runs');
            expect(typeof job.licensed_runs).toBe('number');
            expect(job).toHaveProperty('location_id');
            expect(typeof job.location_id).toBe('number');
            expect(job).toHaveProperty('output_location_id');
            expect(typeof job.output_location_id).toBe('number');
            expect(job).toHaveProperty('probability');
            expect(typeof job.probability).toBe('number');
            expect(job).toHaveProperty('product_type_id');
            expect(typeof job.product_type_id).toBe('number');
            expect(job).toHaveProperty('runs');
            expect(typeof job.runs).toBe('number');
            expect(job).toHaveProperty('start_date');
            expect(typeof job.start_date).toBe('string');
            expect(job).toHaveProperty('status');
            expect(typeof job.status).toBe('string');
        });
    });
});
