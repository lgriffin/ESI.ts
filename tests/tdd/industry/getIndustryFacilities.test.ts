import { GetIndustryFacilitiesApi } from '../../../src/api/industry/getIndustryFacilities';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const industryFacilitiesApi = new GetIndustryFacilitiesApi(client);

describe('GetIndustryFacilitiesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for industry facilities', async () => {
        const mockResponse = [
            {
                facility_id: 1,
                type_id: 2,
                solar_system_id: 3,
                region_id: 4,
                starbase_modifier: 0.5,
                tax: 0.1
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => industryFacilitiesApi.getIndustryFacilities());

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
});
