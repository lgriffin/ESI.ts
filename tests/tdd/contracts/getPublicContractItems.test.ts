import { GetPublicContractItemsApi } from '../../../src/api/contracts/getPublicContractItems';
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

const publicContractItemsApi = new GetPublicContractItemsApi(client);

describe('GetPublicContractItemsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for public contract items', async () => {
        const mockResponse = [
            {
                item_id: 1,
                type_id: 2,
                quantity: 3,
                is_included: true
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => publicContractItemsApi.getPublicContractItems(987654321));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach((item) => {
            expect(item).toHaveProperty('item_id');
            expect(typeof item.item_id).toBe('number');
            expect(item).toHaveProperty('type_id');
            expect(typeof item.type_id).toBe('number');
            expect(item).toHaveProperty('quantity');
            expect(typeof item.quantity).toBe('number');
            expect(item).toHaveProperty('is_included');
            expect(typeof item.is_included).toBe('boolean');
        });
    });
});
