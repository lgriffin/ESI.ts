import { GetPublicContractBidsApi } from '../../../src/api/contracts/getPublicContractBids';
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
const publicContractBidsApi = new GetPublicContractBidsApi(client);

describe('GetPublicContractBidsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for public contract bids', async () => {
        const mockResponse = [
            {
                bid_id: 1,
                amount: 1000000.0,
                date_bid: '2024-01-02T00:00:00Z',
                bidder_id: 123456789
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await publicContractBidsApi.getPublicContractBids(987654321);

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach((bid) => {
            expect(bid).toHaveProperty('bid_id');
            expect(typeof bid.bid_id).toBe('number');
            expect(bid).toHaveProperty('amount');
            expect(typeof bid.amount).toBe('number');
            expect(bid).toHaveProperty('date_bid');
            expect(typeof bid.date_bid).toBe('string');
            expect(bid).toHaveProperty('bidder_id');
            expect(typeof bid.bidder_id).toBe('number');
        });
    });
});
