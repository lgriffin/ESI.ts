// tests/tdd/wallet/getCharacterWalletJournal.test.ts
import { GetCharacterWalletJournalApi } from '../../../src/api/wallet/getCharacterWalletJournal';
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

const walletJournalApi = new GetCharacterWalletJournalApi(client);

describe('GetCharacterWalletJournalApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character wallet journal', async () => {
        const mockResponse = [
            {
                date: '2024-01-01T00:00:00Z',
                ref_id: 1,
                amount: 123.45,
                balance: 123456.78,
                reason: 'Transaction',
                type_id: 456,
                owner_id1: 789,
                owner_id2: 101112
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => walletJournalApi.getCharacterWalletJournal(123456789));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((entry: { date: string; ref_id: number; amount: number; balance: number; reason: string; type_id: number; owner_id1: number; owner_id2: number }) => {
            expect(entry).toHaveProperty('date');
            expect(entry).toHaveProperty('ref_id');
            expect(entry).toHaveProperty('amount');
            expect(entry).toHaveProperty('balance');
            expect(entry).toHaveProperty('reason');
            expect(entry).toHaveProperty('type_id');
            expect(entry).toHaveProperty('owner_id1');
            expect(entry).toHaveProperty('owner_id2');
        });
    });
});
