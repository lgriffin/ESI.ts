import { KillmailsApiBuilder } from '../../../src/builders/KillmailsBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { KillmailsClient } from '../../../src/clients/KillmailsClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('KillmailsApiBuilder', () => {
    it('should build and return a KillmailsClient instance', () => {
        const builder = new KillmailsApiBuilder(client);
        const killmailsClient = builder.build();

        expect(killmailsClient).toBeInstanceOf(KillmailsClient);
    });
});
