import { ApiClient } from '../../../src/core/ApiClient';
import { SearchApiBuilder } from '../../../src/builders/SearchApiBuilder';
import { SearchClient } from '../../../src/clients/SearchClient';

describe('SearchApiBuilder', () => {
    let client: ApiClient;

    beforeEach(() => {
        client = new ApiClient('projectName', 'https://esi.evetech.net/latest', 'token');
    });

    it('should build a SearchClient', () => {
        const builder = new SearchApiBuilder(client);
        const searchClient = builder.build();
        expect(searchClient).toBeInstanceOf(SearchClient);
    });
});
