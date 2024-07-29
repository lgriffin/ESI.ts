import { PostOpenMarketDetailsWindowApi } from '../../../src/api/ui/postOpenMarketDetailsWindow';
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

const openMarketDetailsWindowApi = new PostOpenMarketDetailsWindowApi(client);

describe('PostOpenMarketDetailsWindowApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should open market details window', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = {
            type_id: 123456
        };

        const result = await openMarketDetailsWindowApi.openMarketDetailsWindow(body);

        expect(result).toEqual({ error: 'no content' });
    });
});
