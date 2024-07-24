import { GetCorporationMiningObserversApi } from '../../../src/api/industry/getCorporationMiningObservers';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const corporationMiningObserversApi = new GetCorporationMiningObserversApi(client);

describe('GetCorporationMiningObserversApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation mining observers', async () => {
        const mockResponse = [
            {
                last_updated: '2024-01-01T00:00:00Z',
                observer_id: 123456789,
                observer_type: 'structure'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationMiningObserversApi.getCorporationMiningObservers(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((observer: any) => {
            expect(observer).toHaveProperty('last_updated');
            expect(typeof observer.last_updated).toBe('string');
            expect(observer).toHaveProperty('observer_id');
            expect(typeof observer.observer_id).toBe('number');
            expect(observer).toHaveProperty('observer_type');
            expect(typeof observer.observer_type).toBe('string');
        });
    });
});
