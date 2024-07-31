// tests/tdd/contacts/ContactsApiBuilder.test.ts
import { ContactsApiBuilder } from '../../../src/builders/ContactsApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { ContactsClient } from '../../../src/clients/ContactsClient';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

describe('ContactsApiBuilder', () => {
    it('should build and return a ContactsClient instance', () => {
        const builder = new ContactsApiBuilder(client);
        const contactsClient = builder.build();

        expect(contactsClient).toBeInstanceOf(ContactsClient);
    });
});
