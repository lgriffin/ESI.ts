import { CorporationBookmarkFoldersApi } from '../../../src/api/bookmarks/getCorporationBookmarkFolders';
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

describe('CorporationBookmarkFoldersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return corporation bookmark folders', async () => {
        const mockResponse = [/* Mock data here */];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const api = new CorporationBookmarkFoldersApi(client);
        const result = await api.getCorporationBookmarkFolders(12345);

        expect(result).toEqual(mockResponse);
    });
});
