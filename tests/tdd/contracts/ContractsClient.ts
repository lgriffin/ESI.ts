import { ContractsClient } from '../../../src/clients/ContractsClient';
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

const contractClient = new ContractsClient(client);

describe('ContractClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getContracts', async () => {
        const mockResponse = [
            {
                contract_id: 1,
                issuer_id: 123,
                start_location_id: 456,
                type: 'item_exchange'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contractClient.getCharacterContracts(123456789));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(contract => {
            expect(contract).toHaveProperty('contract_id');
            expect(typeof contract.contract_id).toBe('number');
            expect(contract).toHaveProperty('issuer_id');
            expect(typeof contract.issuer_id).toBe('number');
            expect(contract).toHaveProperty('start_location_id');
            expect(typeof contract.start_location_id).toBe('number');
            expect(contract).toHaveProperty('type');
            expect(typeof contract.type).toBe('string');
        });
    });

    it('should return valid structure for getContractBids', async () => {
        const mockResponse = [
            {
                bid_id: 1,
                amount: 1000000,
                date_bid: '2024-07-01T12:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contractClient.getCharacterContractBids(123456789, 1));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(bid => {
            expect(bid).toHaveProperty('bid_id');
            expect(typeof bid.bid_id).toBe('number');
            expect(bid).toHaveProperty('amount');
            expect(typeof bid.amount).toBe('number');
            expect(bid).toHaveProperty('date_bid');
            expect(typeof bid.date_bid).toBe('string');
        });
    });

    it('should return valid structure for getContractItems', async () => {
        const mockResponse = [
            {
                item_id: 1,
                type_id: 2,
                quantity: 3
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contractClient.getCharacterContractItems(123456789, 1));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(item => {
            expect(item).toHaveProperty('item_id');
            expect(typeof item.item_id).toBe('number');
            expect(item).toHaveProperty('type_id');
            expect(typeof item.type_id).toBe('number');
            expect(item).toHaveProperty('quantity');
            expect(typeof item.quantity).toBe('number');
        });
    });

    it('should return valid structure for getPublicContracts', async () => {
        const mockResponse = [
            {
                contract_id: 1,
                issuer_id: 123,
                start_location_id: 456,
                type: 'item_exchange'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contractClient.getPublicContracts(123));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(contract => {
            expect(contract).toHaveProperty('contract_id');
            expect(typeof contract.contract_id).toBe('number');
            expect(contract).toHaveProperty('issuer_id');
            expect(typeof contract.issuer_id).toBe('number');
            expect(contract).toHaveProperty('start_location_id');
            expect(typeof contract.start_location_id).toBe('number');
            expect(contract).toHaveProperty('type');
            expect(typeof contract.type).toBe('string');
        });
    });

    it('should return valid structure for getPublicContractBids', async () => {
        const mockResponse = [
            {
                bid_id: 1,
                amount: 1000000,
                date_bid: '2024-07-01T12:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contractClient.getPublicContractBids(1));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(bid => {
            expect(bid).toHaveProperty('bid_id');
            expect(typeof bid.bid_id).toBe('number');
            expect(bid).toHaveProperty('amount');
            expect(typeof bid.amount).toBe('number');
            expect(bid).toHaveProperty('date_bid');
            expect(typeof bid.date_bid).toBe('string');
        });
    });

    it('should return valid structure for getPublicContractItems', async () => {
        const mockResponse = [
            {
                item_id: 1,
                type_id: 2,
                quantity: 3
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contractClient.getPublicContractItems(1));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(item => {
            expect(item).toHaveProperty('item_id');
            expect(typeof item.item_id).toBe('number');
            expect(item).toHaveProperty('type_id');
            expect(typeof item.type_id).toBe('number');
            expect(item).toHaveProperty('quantity');
            expect(typeof item.quantity).toBe('number');
        });
    });

    it('should return valid structure for getCorporationContracts', async () => {
        const mockResponse = [
            {
                contract_id: 1,
                issuer_id: 123,
                start_location_id: 456,
                type: 'item_exchange'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contractClient.getCorporationContracts(123456789));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(contract => {
            expect(contract).toHaveProperty('contract_id');
            expect(typeof contract.contract_id).toBe('number');
            expect(contract).toHaveProperty('issuer_id');
            expect(typeof contract.issuer_id).toBe('number');
            expect(contract).toHaveProperty('start_location_id');
            expect(typeof contract.start_location_id).toBe('number');
            expect(contract).toHaveProperty('type');
            expect(typeof contract.type).toBe('string');
        });
    });

    it('should return valid structure for getCorporationContractBids', async () => {
        const mockResponse = [
            {
                bid_id: 1,
                amount: 1000000,
                date_bid: '2024-07-01T12:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contractClient.getCorporationContractBids(123456789, 1));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(bid => {
            expect(bid).toHaveProperty('bid_id');
            expect(typeof bid.bid_id).toBe('number');
            expect(bid).toHaveProperty('amount');
            expect(typeof bid.amount).toBe('number');
            expect(bid).toHaveProperty('date_bid');
            expect(typeof bid.date_bid).toBe('string');
        });
    });

    it('should return valid structure for getCorporationContractItems', async () => {
        const mockResponse = [
            {
                item_id: 1,
                type_id: 2,
                quantity: 3
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contractClient.getCorporationContractItems(123456789, 1));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(item => {
            expect(item).toHaveProperty('item_id');
            expect(typeof item.item_id).toBe('number');
            expect(item).toHaveProperty('type_id');
            expect(typeof item.type_id).toBe('number');
            expect(item).toHaveProperty('quantity');
            expect(typeof item.quantity).toBe('number');
        });
    });
});
