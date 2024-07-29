import { MailApiBuilder } from '../../../src/builders/MailApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { MailClient } from '../../../src/clients/MailClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('MailApiBuilder', () => {
    it('should build and return a MailClient instance', () => {
        const builder = new MailApiBuilder(client);
        const mailClient = builder.build();

        expect(mailClient).toBeInstanceOf(MailClient);
    });
});
