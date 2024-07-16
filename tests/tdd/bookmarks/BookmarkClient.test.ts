import { BookmarkClient } from '../../../src/clients/BookmarkClient';
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

describe('BookmarkClient', () => {
    let bookmarkClient: BookmarkClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        bookmarkClient = new BookmarkClient(client);
    });

    it('should return character bookmarks', async () => {
        const mockResponse = [/* Mock data here */];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await bookmarkClient.getCharacterBookmarks(12345);
        expect(result).toEqual(mockResponse);
    });

    it('should return character bookmark folders', async () => {
        const mockResponse = [/* Mock data here */];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await bookmarkClient.getCharacterBookmarkFolders(12345);
        expect(result).toEqual(mockResponse);
    });

    it('should return corporation bookmarks', async () => {
        const mockResponse = [/* Mock data here */];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await bookmarkClient.getCorporationBookmarks(12345);
        expect(result).toEqual(mockResponse);
    });

    it('should return corporation bookmark folders', async () => {
        const mockResponse = [/* Mock data here */];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await bookmarkClient.getCorporationBookmarkFolders(12345);
        expect(result).toEqual(mockResponse);
    });
});
