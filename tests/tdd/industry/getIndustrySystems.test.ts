import { GetIndustrySystemsApi } from '../../../src/api/industry/getIndustrySystems';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const industrySystemsApi = new GetIndustrySystemsApi(client);

describe('GetIndustrySystemsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for industry systems', async () => {
        const mockResponse = [
            {
                solar_system_id: 1,
                cost_indices: [
                    {
                        activity: 'manufacturing',
                        cost_index: 0.1
                    }
                ]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await industrySystemsApi.getIndustrySystems();

        expect(Array.isArray(result)).toBe(true);
        result.forEach((system: any) => {
            expect(system).toHaveProperty('solar_system_id');
            expect(typeof system.solar_system_id).toBe('number');
            expect(system).toHaveProperty('cost_indices');
            expect(Array.isArray(system.cost_indices)).toBe(true);
            system.cost_indices.forEach((costIndex: any) => {
                expect(costIndex).toHaveProperty('activity');
                expect(typeof costIndex.activity).toBe('string');
                expect(costIndex).toHaveProperty('cost_index');
                expect(typeof costIndex.cost_index).toBe('number');
            });
        });
    });
});
