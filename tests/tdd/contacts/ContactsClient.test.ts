import { ContactsClient } from '../../../src/clients/ContactsClient';
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

const contactsClient = new ContactsClient(client);

describe('ContactsClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getAllianceContacts', async () => {
        const mockResponse = [
            {
                contact_id: 123,
                contact_type: 'character',
                standing: 10,
                label_ids: [1, 2]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await contactsClient.getAllianceContacts(123456);

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(contact => {
            expect(contact).toHaveProperty('contact_id');
            expect(contact).toHaveProperty('contact_type');
            expect(contact).toHaveProperty('standing');
            expect(contact).toHaveProperty('label_ids');
        });
    });

    it('should return valid structure for getAllianceContactLabels', async () => {
        const mockResponse = [
            {
                label_id: 1,
                name: 'VIPs'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await contactsClient.getAllianceContactLabels(123456);

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(label => {
            expect(label).toHaveProperty('label_id');
            expect(label).toHaveProperty('name');
        });
    });

    // Add other tests for the remaining APIs following the same pattern
});
