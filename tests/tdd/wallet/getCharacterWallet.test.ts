// tests/tdd/wallet/getCharacterWallet.test.ts
import { GetCharacterWalletApi } from '../../../src/api/wallet/getCharacterWallet';
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

const walletApi = new GetCharacterWalletApi(client);

describe('GetCharacterWalletApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character wallet balance', async () => {
        const mockResponse = {
            balance: 123456.78
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => walletApi.getCharacterWallet(123456789));

        expect(result).toHaveProperty('balance');
        expect(typeof result.balance).toBe('number');
    });
});
