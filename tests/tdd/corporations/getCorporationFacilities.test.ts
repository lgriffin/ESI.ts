import { GetCorporationFacilitiesApi } from '../../../src/api/corporations/getCorporationFacilities';
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

const corporationFacilitiesApi = new GetCorporationFacilitiesApi(client);

describe('GetCorporationFacilitiesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation facilities', async () => {
        const mockResponse = [
            {
                facility_id: 12345,
                type_id: 67890,
                solar_system_id: 54321,
                region_id: 98765,
                starbase_id: 11223,
                owner_id: 44556,
                name: 'Facility Name',
                system_cost_index: 0.5
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationFacilitiesApi.getCorporationFacilities(12345);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((facility: { facility_id: number; type_id: number; solar_system_id: number; region_id: number; starbase_id: number; owner_id: number; name: string; system_cost_index: number }) => {
            expect(facility).toHaveProperty('facility_id');
            expect(typeof facility.facility_id).toBe('number');
            expect(facility).toHaveProperty('type_id');
            expect(typeof facility.type_id).toBe('number');
            expect(facility).toHaveProperty('solar_system_id');
            expect(typeof facility.solar_system_id).toBe('number');
            expect(facility).toHaveProperty('region_id');
            expect(typeof facility.region_id).toBe('number');
            expect(facility).toHaveProperty('starbase_id');
            expect(typeof facility.starbase_id).toBe('number');
            expect(facility).toHaveProperty('owner_id');
            expect(typeof facility.owner_id).toBe('number');
            expect(facility).toHaveProperty('name');
            expect(typeof facility.name).toBe('string');
            expect(facility).toHaveProperty('system_cost_index');
            expect(typeof facility.system_cost_index).toBe('number');
        });
    });
});
