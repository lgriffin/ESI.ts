import { PostOpenNewMailWindowApi } from '../../../src/api/ui/postOpenNewMailWindow';
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

const openNewMailWindowApi = new PostOpenNewMailWindowApi(client);

describe('PostOpenNewMailWindowApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should open new mail window', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = {
            to: [123456789],
            subject: 'Test Subject',
            body: 'Test Body'
        };

        const result = await getBody(() => openNewMailWindowApi.openNewMailWindow(body));

        expect(result).toEqual({ error: 'no content' });
    });
});
