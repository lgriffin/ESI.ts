import { putCharacterContacts } from '../../../src/api/contacts/putCharacterContacts';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterContactsApi = new putCharacterContacts(client);

describe('putCharacterContacts', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should edit character contacts', async () => {
        const mockResponse = '';

        fetchMock.mockResponseOnce(mockResponse, { status: 204 });

        const contacts = {
            contact_ids: [123, 456],
            standing: 5,
            label_ids: [1, 2]
        };

        const result = await characterContactsApi.editContacts(123456, contacts);

        expect(result).toEqual({ error: 'no content' });
    });
});
