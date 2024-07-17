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

const mockResponse: Array<{folder_id: number, name: string, creator_id: number, created: string}> = [
    {
        folder_id: 2001,
        name: 'Test Folder',
        creator_id: 1001,
        created: '2024-01-01T00:00:00Z'
    }
];

describe('CorporationBookmarkFoldersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return corporation bookmark folders', async () => {
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const api = new CorporationBookmarkFoldersApi(client);
        const result = await api.getCorporationBookmarkFolders(12345);

        expect(result).toEqual(mockResponse);
    });
});
