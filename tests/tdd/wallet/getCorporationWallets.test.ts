// tests/tdd/wallet/getCorporationWallets.test.ts
import { GetCorporationWalletsApi } from '../../../src/api/wallet/getCorporationWallets';
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

const corporationWalletsApi = new GetCorporationWalletsApi(client);

describe('GetCorporationWalletsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return corporation wallet balance', async () => {
        const mockResponse = [
            {
                division: 1,
                balance: 123456.78
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationWalletsApi.getCorporationWallets(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((wallet: { division: number; balance: number }) => {
            expect(wallet).toHaveProperty('division');
            expect(typeof wallet.division).toBe('number');
            expect(wallet).toHaveProperty('balance');
            expect(typeof wallet.balance).toBe('number');
        });
    });
});
