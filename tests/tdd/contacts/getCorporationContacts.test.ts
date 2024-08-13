import { getCorporationContacts } from '../../../src/api/contacts/getCorporationContacts';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const corporationContactsApi = new getCorporationContacts(client);

describe('getCorporationContacts', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return corporation contacts', async () => {
        const mockResponse = [
            {
                contact_id: 123,
                contact_type: 'character',
                standing: 10,
                label_ids: [1, 2]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationContactsApi.getContacts(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((contact: any) => {
            expect(contact).toHaveProperty('contact_id');
            expect(contact).toHaveProperty('contact_type');
            expect(contact).toHaveProperty('standing');
            expect(contact).toHaveProperty('label_ids');
        });
    });
});
