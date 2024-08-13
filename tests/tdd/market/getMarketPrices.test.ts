import { getMarketPrices } from '../../../src/api/market/getMarketPrices';
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

const marketPricesApi = new getMarketPrices(client);

describe('GetMarketPricesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return market prices', async () => {
        const mockResponse = [
            {
                type_id: 34,
                average_price: 5.27,
                adjusted_price: 5.19
            },
            {
                type_id: 35,
                average_price: 15.43,
                adjusted_price: 14.89
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => marketPricesApi.getMarketPrices());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((price: { type_id: number, average_price: number, adjusted_price: number }) => {
            expect(price).toHaveProperty('type_id');
            expect(typeof price.type_id).toBe('number');
            expect(price).toHaveProperty('average_price');
            expect(typeof price.average_price).toBe('number');
            expect(price).toHaveProperty('adjusted_price');
            expect(typeof price.adjusted_price).toBe('number');
        });
    });
});
