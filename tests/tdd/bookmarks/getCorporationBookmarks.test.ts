import { CorporationBookmarksApi } from '../../../src/api/bookmarks/getCorporationBookmarks';
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

describe('CorporationBookmarksApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return corporation bookmarks', async () => {
        const mockResponse = [/* Mock data here */];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const api = new CorporationBookmarksApi(client);
        const result = await api.getCorporationBookmarks(12345);

        expect(result).toEqual(mockResponse);
    });
});
