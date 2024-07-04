import { ApiClient } from '../../../src/core/ApiClient';
import { FactionAPIBuilder } from '../../../src/builders/FactionAPIBuilder';
import { FactionClient } from '../../../src/clients/FactionClient';

describe('FactionAPIBuilder', () => {
    let client: ApiClient;

    beforeEach(() => {
        client = new ApiClient('clientId', 'link', 'authToken');
    });

    it('should build a FactionClient instance', () => {
        const builder = new FactionAPIBuilder(client);
        const factionClient = builder.build();
        expect(factionClient).toBeInstanceOf(FactionClient);
    });
});
