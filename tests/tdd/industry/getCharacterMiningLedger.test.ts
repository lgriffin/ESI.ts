import { GetCharacterMiningLedgerApi } from '../../../src/api/industry/getCharacterMiningLedger';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterMiningLedgerApi = new GetCharacterMiningLedgerApi(client);

describe('GetCharacterMiningLedgerApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character mining ledger', async () => {
        const mockResponse = [
            {
                date: '2024-01-01',
                solar_system_id: 30000142,
                type_id: 1230,
                quantity: 1000
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await characterMiningLedgerApi.getCharacterMiningLedger(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((entry: any) => {
            expect(entry).toHaveProperty('date');
            expect(typeof entry.date).toBe('string');
            expect(entry).toHaveProperty('solar_system_id');
            expect(typeof entry.solar_system_id).toBe('number');
            expect(entry).toHaveProperty('type_id');
            expect(typeof entry.type_id).toBe('number');
            expect(entry).toHaveProperty('quantity');
            expect(typeof entry.quantity).toBe('number');
        });
    });
});
