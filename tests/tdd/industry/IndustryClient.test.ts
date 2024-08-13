import { IndustryClient } from '../../../src/clients/IndustryClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();

const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

const industryClient = new IndustryClient(client);

describe('IndustryClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getCharacterIndustryJobs', async () => {
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

        const result = await getBody(() => industryClient.getCharacterIndustryJobs(123456789));

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

    it('should return valid structure for getCharacterMiningLedger', async () => {
        const mockResponse = [
            {
                date: '2024-01-01',
                quantity: 1000,
                solar_system_id: 30000142,
                type_id: 1234
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => industryClient.getCharacterMiningLedger(123456789));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((ledger: any) => {
            expect(ledger).toHaveProperty('date');
            expect(typeof ledger.date).toBe('string');
            expect(ledger).toHaveProperty('quantity');
            expect(typeof ledger.quantity).toBe('number');
            expect(ledger).toHaveProperty('solar_system_id');
            expect(typeof ledger.solar_system_id).toBe('number');
            expect(ledger).toHaveProperty('type_id');
            expect(typeof ledger.type_id).toBe('number');
        });
    });

    it('should return valid structure for getMoonExtractionTimers', async () => {
        const mockResponse = [
            {
                structure_id: 123456789,
                moon_id: 987654321,
                extraction_start_time: '2024-01-01T00:00:00Z',
                chunk_arrival_time: '2024-01-01T12:00:00Z',
                natural_decay_time: '2024-01-02T00:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => industryClient.getMoonExtractionTimers(123456789));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((timer: any) => {
            expect(timer).toHaveProperty('structure_id');
            expect(typeof timer.structure_id).toBe('number');
            expect(timer).toHaveProperty('moon_id');
            expect(typeof timer.moon_id).toBe('number');
            expect(timer).toHaveProperty('extraction_start_time');
            expect(typeof timer.extraction_start_time).toBe('string');
            expect(timer).toHaveProperty('chunk_arrival_time');
            expect(typeof timer.chunk_arrival_time).toBe('string');
            expect(timer).toHaveProperty('natural_decay_time');
            expect(typeof timer.natural_decay_time).toBe('string');
        });
    });

    it('should return valid structure for getCorporationMiningObservers', async () => {
        const mockResponse = [
            {
                observer_id: 1,
                type: 'structure',
                last_updated: '2024-01-01T00:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => industryClient.getCorporationMiningObservers(123456789));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((observer: any) => {
            expect(observer).toHaveProperty('observer_id');
            expect(typeof observer.observer_id).toBe('number');
            expect(observer).toHaveProperty('type');
            expect(typeof observer.type).toBe('string');
            expect(observer).toHaveProperty('last_updated');
            expect(typeof observer.last_updated).toBe('string');
        });
    });

    it('should return valid structure for getCorporationMiningObserver', async () => {
        const mockResponse = [
            {
                character_id: 123456,
                type_id: 654321,
                quantity: 1000,
                recorded_corporation_id: 789012,
                last_updated: '2024-01-01T00:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => industryClient.getCorporationMiningObserver(123456789, 987654321));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((record: any) => {
            expect(record).toHaveProperty('character_id');
            expect(typeof record.character_id).toBe('number');
            expect(record).toHaveProperty('type_id');
            expect(typeof record.type_id).toBe('number');
            expect(record).toHaveProperty('quantity');
            expect(typeof record.quantity).toBe('number');
            expect(record).toHaveProperty('recorded_corporation_id');
            expect(typeof record.recorded_corporation_id).toBe('number');
            expect(record).toHaveProperty('last_updated');
            expect(typeof record.last_updated).toBe('string');
        });
    });

    it('should return valid structure for getCorporationIndustryJobs', async () => {
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

        const result = await getBody(() => industryClient.getCorporationIndustryJobs(123456789));

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

    it('should return valid structure for getIndustryFacilities', async () => {
        const mockResponse = [
            {
                facility_id: 1,
                type_id: 2,
                solar_system_id: 3,
                region_id: 4,
                starbase_modifier: 5.0,
                tax: 6.0
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => industryClient.getIndustryFacilities());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((facility: any) => {
            expect(facility).toHaveProperty('facility_id');
            expect(typeof facility.facility_id).toBe('number');
            expect(facility).toHaveProperty('type_id');
            expect(typeof facility.type_id).toBe('number');
            expect(facility).toHaveProperty('solar_system_id');
            expect(typeof facility.solar_system_id).toBe('number');
            expect(facility).toHaveProperty('region_id');
            expect(typeof facility.region_id).toBe('number');
            expect(facility).toHaveProperty('starbase_modifier');
            expect(typeof facility.starbase_modifier).toBe('number');
            expect(facility).toHaveProperty('tax');
            expect(typeof facility.tax).toBe('number');
        });
    });

    it('should return valid structure for getIndustrySystems', async () => {
        const mockResponse = [
            {
                solar_system_id: 1,
                cost_indices: [
                    {
                        activity: 'manufacturing',
                        cost_index: 0.01
                    }
                ]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => industryClient.getIndustrySystems());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((system: any) => {
            expect(system).toHaveProperty('solar_system_id');
            expect(typeof system.solar_system_id).toBe('number');
            expect(system).toHaveProperty('cost_indices');
            expect(Array.isArray(system.cost_indices)).toBe(true);
            system.cost_indices.forEach((index: any) => {
                expect(index).toHaveProperty('activity');
                expect(typeof index.activity).toBe('string');
                expect(index).toHaveProperty('cost_index');
                expect(typeof index.cost_index).toBe('number');
            });
        });
    });
});
