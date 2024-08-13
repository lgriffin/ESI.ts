import { PostOpenInformationWindowApi } from '../../../src/api/ui/postOpenInformationWindow';
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

const openInformationWindowApi = new PostOpenInformationWindowApi(client);

describe('PostOpenInformationWindowApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should open information window', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = {
            target_id: 123456789
        };

        const result = await getBody(() => openInformationWindowApi.openInformationWindow(body));

        expect(result).toEqual({ error: 'no content' });
    });
});
