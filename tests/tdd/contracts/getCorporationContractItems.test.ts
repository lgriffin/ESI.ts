import { GetCorporationContractItemsApi } from '../../../src/api/contracts/getCorporationContractItems';
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

const corporationContractItemsApi = new GetCorporationContractItemsApi(client);

describe('GetCorporationContractItemsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation contract items', async () => {
        const mockResponse = [
            {
                item_id: 1,
                type_id: 2,
                quantity: 3,
                is_included: true
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationContractItemsApi.getCorporationContractItems(123456789, 987654321));

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
