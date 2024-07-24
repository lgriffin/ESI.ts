import { GetCorporationMiningObserverApi } from '../../../src/api/industry/getCorporationMiningObserver';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const corporationMiningObserverApi = new GetCorporationMiningObserverApi(client);

describe('GetCorporationMiningObserverApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for observed corporation mining', async () => {
        const mockResponse = [
            {
                character_id: 123456789,
                last_updated: '2024-01-01T00:00:00Z',
                quantity: 1000,
                recorded_corporation_id: 987654321,
                type_id: 1234
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationMiningObserverApi.getCorporationMiningObserver(123456789, 987654321);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((mining: any) => {
            expect(mining).toHaveProperty('character_id');
            expect(typeof mining.character_id).toBe('number');
            expect(mining).toHaveProperty('last_updated');
            expect(typeof mining.last_updated).toBe('string');
            expect(mining).toHaveProperty('quantity');
            expect(typeof mining.quantity).toBe('number');
            expect(mining).toHaveProperty('recorded_corporation_id');
            expect(typeof mining.recorded_corporation_id).toBe('number');
            expect(mining).toHaveProperty('type_id');
            expect(typeof mining.type_id).toBe('number');
        });
    });
});
