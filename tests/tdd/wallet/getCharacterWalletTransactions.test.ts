// tests/tdd/wallet/getCharacterWalletTransactions.test.ts
import { GetCharacterWalletTransactionsApi } from '../../../src/api/wallet/getCharacterWalletTransactions';
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

const walletTransactionsApi = new GetCharacterWalletTransactionsApi(client);

describe('GetCharacterWalletTransactionsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character wallet transactions', async () => {
        const mockResponse = [
            {
                transaction_id: 1,
                date: '2024-01-01T00:00:00Z',
                quantity: 10,
                type_id: 123,
                unit_price: 10.5,
                client_id: 456,
                location_id: 789,
                is_buy: true,
                is_personal: true,
                journal_ref_id: 101112
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => walletTransactionsApi.getCharacterWalletTransactions(123456789));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((transaction: { transaction_id: number; date: string; quantity: number; type_id: number; unit_price: number; client_id: number; location_id: number; is_buy: boolean; is_personal: boolean; journal_ref_id: number }) => {
            expect(transaction).toHaveProperty('transaction_id');
            expect(transaction).toHaveProperty('date');
            expect(transaction).toHaveProperty('quantity');
            expect(transaction).toHaveProperty('type_id');
            expect(transaction).toHaveProperty('unit_price');
            expect(transaction).toHaveProperty('client_id');
            expect(transaction).toHaveProperty('location_id');
            expect(transaction).toHaveProperty('is_buy');
            expect(transaction).toHaveProperty('is_personal');
            expect(transaction).toHaveProperty('journal_ref_id');
        });
    });
});
