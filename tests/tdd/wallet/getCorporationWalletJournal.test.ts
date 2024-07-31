// tests/tdd/wallet/getCorporationWalletJournal.test.ts
import { GetCorporationWalletJournalApi } from '../../../src/api/wallet/getCorporationWalletJournal';
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

const corporationWalletJournalApi = new GetCorporationWalletJournalApi(client);

describe('GetCorporationWalletJournalApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return corporation wallet journal', async () => {
        const mockResponse = [
            {
                date: '2024-01-01T00:00:00Z',
                ref_id: 1,
                amount: 123.45,
                balance: 123456.78,
                reason: 'Transaction',
                type_id: 456,
                first_party_id: 789,
                second_party_id: 101112
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationWalletJournalApi.getCorporationWalletJournal(123456789, 1);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((entry: { date: string; ref_id: number; amount: number; balance: number; reason: string; type_id: number; first_party_id: number; second_party_id: number }) => {
            expect(entry).toHaveProperty('date');
            expect(entry).toHaveProperty('ref_id');
            expect(entry).toHaveProperty('amount');
            expect(entry).toHaveProperty('balance');
            expect(entry).toHaveProperty('reason');
            expect(entry).toHaveProperty('type_id');
            expect(entry).toHaveProperty('first_party_id');
            expect(entry).toHaveProperty('second_party_id');
        });
    });
});
