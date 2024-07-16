import { ClonesApiBuilder } from '../../../src/builders/ClonesApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { ClonesClient } from '../../../src/clients/ClonesClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('ClonesApiBuilder', () => {
    it('should build a ClonesClient instance', () => {
        const builder = new ClonesApiBuilder(client);
        const clonesClient = builder.build();
        expect(clonesClient).toBeInstanceOf(ClonesClient);
    });
});