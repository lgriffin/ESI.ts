import { postCharacterContacts } from '../../../src/api/contacts/postCharacterContacts';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterContactsApi = new postCharacterContacts(client);

describe('postCharacterContacts', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should add character contacts', async () => {
        const mockResponse = '';

        fetchMock.mockResponseOnce(mockResponse, { status: 201 });

        const contacts = {
            contact_ids: [123, 456],
            standing: 5,
            label_ids: [1, 2]
        };

        const result = await characterContactsApi.addContacts(123456, contacts);

        expect(result).toEqual({ error: 'created' });
    });
});
