import { IndustryApiBuilder } from '../../../src/builders/IndustryApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { IndustryClient } from '../../../src/clients/IndustryClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('IndustryApiBuilder', () => {
    it('should build and return an IndustryClient instance', () => {
        const builder = new IndustryApiBuilder(client);
        const industryClient = builder.build();

        expect(industryClient).toBeInstanceOf(IndustryClient);
    });
});
