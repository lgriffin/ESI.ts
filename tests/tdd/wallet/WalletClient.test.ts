import { WalletClient } from '../../../src/clients/WalletClient';
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

const walletClient = new WalletClient(client);

describe('WalletClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character wallet balance', async () => {
        const mockResponse = {
            balance: 123456.78
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => walletClient.getCharacterWallet(123456789));

        expect(result).toHaveProperty('balance');
        expect(typeof result.balance).toBe('number');
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
                first_party_id: 789,
                second_party_id: 101112
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => walletClient.getCharacterWalletJournal(123456789));

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

        const result = await getBody(() => walletClient.getCharacterWalletTransactions(123456789));

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

    it('should return corporation wallet balance', async () => {
        const mockResponse = [
            {
                division: 1,
                balance: 123456.78
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => walletClient.getCorporationWallets(123456789));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((wallet: { division: number; balance: number }) => {
            expect(wallet).toHaveProperty('division');
            expect(typeof wallet.division).toBe('number');
            expect(wallet).toHaveProperty('balance');
            expect(typeof wallet.balance).toBe('number');
        });
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

        const result = await getBody(() => walletClient.getCorporationWalletJournal(123456789, 1));

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

    it('should return corporation wallet transactions', async () => {
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

        const result = await getBody(() => walletClient.getCorporationWalletTransactions(123456789, 1));

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
