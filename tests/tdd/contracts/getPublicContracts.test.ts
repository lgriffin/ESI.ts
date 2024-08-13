import { GetPublicContractsApi } from '../../../src/api/contracts/getPublicContracts';
import fetchMock from 'jest-fetch-mock';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

fetchMock.enableMocks();


const publicContractsApi = new GetPublicContractsApi(client);

describe('GetPublicContractsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for public contracts', async () => {
        const mockResponse = [
            {
                contract_id: 123,
                type: 'item_exchange',
                status: 'outstanding',
                for_corporation: false,
                availability: 'public',
                date_issued: '2024-01-01T00:00:00Z',
                date_expired: '2024-01-08T00:00:00Z',
                date_accepted: '2024-01-02T00:00:00Z',
                date_completed: '2024-01-03T00:00:00Z',
                price: 1000000.0,
                reward: 100000.0,
                collateral: 500000.0,
                buyout: 2000000.0,
                volume: 500.0
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => publicContractsApi.getPublicContracts(10000001));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach((contract) => {
            expect(contract).toHaveProperty('contract_id');
            expect(typeof contract.contract_id).toBe('number');
            expect(contract).toHaveProperty('type');
            expect(typeof contract.type).toBe('string');
            expect(contract).toHaveProperty('status');
            expect(typeof contract.status).toBe('string');
            // Add more assertions as needed
        });
    });
});
