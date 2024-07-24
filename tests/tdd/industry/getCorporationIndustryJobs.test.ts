import { GetCorporationIndustryJobsApi } from '../../../src/api/industry/getCorporationIndustryJobs';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const corporationIndustryJobsApi = new GetCorporationIndustryJobsApi(client);

describe('GetCorporationIndustryJobsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation industry jobs', async () => {
        const mockResponse = [
            {
                job_id: 1,
                installer_id: 2,
                facility_id: 3,
                location_id: 4,
                activity_id: 5,
                blueprint_id: 6,
                blueprint_type_id: 7,
                blueprint_location_id: 8,
                output_location_id: 9,
                runs: 10,
                cost: 11.1,
                licensed_runs: 12,
                probability: 0.5,
                product_type_id: 13,
                status: 'active',
                duration: 14,
                start_date: '2024-01-01T00:00:00Z',
                end_date: '2024-01-02T00:00:00Z',
                pause_date: '2024-01-01T12:00:00Z',
                completed_date: '2024-01-02T12:00:00Z',
                completed_character_id: 15
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationIndustryJobsApi.getCorporationIndustryJobs(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((job: any) => {
            expect(job).toHaveProperty('job_id');
            expect(typeof job.job_id).toBe('number');
            expect(job).toHaveProperty('installer_id');
            expect(typeof job.installer_id).toBe('number');
            expect(job).toHaveProperty('facility_id');
            expect(typeof job.facility_id).toBe('number');
            expect(job).toHaveProperty('location_id');
            expect(typeof job.location_id).toBe('number');
            expect(job).toHaveProperty('activity_id');
            expect(typeof job.activity_id).toBe('number');
            expect(job).toHaveProperty('blueprint_id');
            expect(typeof job.blueprint_id).toBe('number');
            expect(job).toHaveProperty('blueprint_type_id');
            expect(typeof job.blueprint_type_id).toBe('number');
            expect(job).toHaveProperty('blueprint_location_id');
            expect(typeof job.blueprint_location_id).toBe('number');
            expect(job).toHaveProperty('output_location_id');
            expect(typeof job.output_location_id).toBe('number');
            expect(job).toHaveProperty('runs');
            expect(typeof job.runs).toBe('number');
            expect(job).toHaveProperty('cost');
            expect(typeof job.cost).toBe('number');
            expect(job).toHaveProperty('licensed_runs');
            expect(typeof job.licensed_runs).toBe('number');
            expect(job).toHaveProperty('probability');
            expect(typeof job.probability).toBe('number');
            expect(job).toHaveProperty('product_type_id');
            expect(typeof job.product_type_id).toBe('number');
            expect(job).toHaveProperty('status');
            expect(typeof job.status).toBe('string');
            expect(job).toHaveProperty('duration');
            expect(typeof job.duration).toBe('number');
            expect(job).toHaveProperty('start_date');
            expect(typeof job.start_date).toBe('string');
            expect(job).toHaveProperty('end_date');
            expect(typeof job.end_date).toBe('string');
            expect(job).toHaveProperty('pause_date');
            expect(typeof job.pause_date).toBe('string');
            expect(job).toHaveProperty('completed_date');
            expect(typeof job.completed_date).toBe('string');
            expect(job).toHaveProperty('completed_character_id');
            expect(typeof job.completed_character_id).toBe('number');
        });
    });
});
