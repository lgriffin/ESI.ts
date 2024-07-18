import { BookmarkApiBuilder } from '../../../src/builders/BookmarkApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { BookmarkClient } from '../../../src/clients/BookmarkClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('BookmarkApiBuilder', () => {
    it('should build a BookmarkClient', () => {
        const builder = new BookmarkApiBuilder(client);
        const bookmarkClient = builder.build();

        expect(bookmarkClient).toBeDefined();
        expect(bookmarkClient).toBeInstanceOf(BookmarkClient);
    });
});
