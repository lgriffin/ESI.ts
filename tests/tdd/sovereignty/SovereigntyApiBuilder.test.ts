import { SovereigntyApiBuilder } from '../../../src/builders/SovereigntyApiBuilder';
import { ApiClient } from '../../../src/core/ApiClient';
import { SovereigntyClient } from '../../../src/clients/SovereigntyClient';

describe('SovereigntyApiBuilder', () => {
    let client: ApiClient;
    let builder: SovereigntyApiBuilder;

    beforeEach(() => {
        client = new ApiClient('dummy-client-id', 'https://esi.evetech.net');
        builder = new SovereigntyApiBuilder(client);
    });

    it('should build SovereigntyClient', () => {
        const sovereigntyClient = builder.build();
        expect(sovereigntyClient).toBeInstanceOf(SovereigntyClient);
    });
});
