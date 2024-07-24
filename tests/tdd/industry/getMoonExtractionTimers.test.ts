import { GetMoonExtractionTimersApi } from '../../../src/api/industry/getMoonExtractionTimers';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const moonExtractionTimersApi = new GetMoonExtractionTimersApi(client);

describe('GetMoonExtractionTimersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for moon extraction timers', async () => {
        const mockResponse = [
            {
                chunk_arrival_time: '2024-01-01T00:00:00Z',
                extraction_start_time: '2024-01-01T00:00:00Z',
                moon_id: 40161465,
                natural_decay_time: '2024-01-01T00:00:00Z',
                structure_id: 1021975535893
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await moonExtractionTimersApi.getMoonExtractionTimers(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((timer: any) => {
            expect(timer).toHaveProperty('chunk_arrival_time');
            expect(typeof timer.chunk_arrival_time).toBe('string');
            expect(timer).toHaveProperty('extraction_start_time');
            expect(typeof timer.extraction_start_time).toBe('string');
            expect(timer).toHaveProperty('moon_id');
            expect(typeof timer.moon_id).toBe('number');
            expect(timer).toHaveProperty('natural_decay_time');
            expect(typeof timer.natural_decay_time).toBe('string');
            expect(timer).toHaveProperty('structure_id');
            expect(typeof timer.structure_id).toBe('number');
        });
    });
});
