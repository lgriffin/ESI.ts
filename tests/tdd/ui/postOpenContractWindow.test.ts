import { PostOpenContractWindowApi } from '../../../src/api/ui/postOpenContractWindow';
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

const openContractWindowApi = new PostOpenContractWindowApi(client);

describe('PostOpenContractWindowApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should open contract window', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = {
            contract_id: 123456789
        };

        const result = await openContractWindowApi.openContractWindow(body);

        expect(result).toEqual({ error: 'no content' });
    });
});
