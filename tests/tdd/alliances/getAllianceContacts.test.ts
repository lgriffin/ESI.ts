import { AllianceContactsApi } from '../../../src/api/alliances/getAllianceContacts';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

interface Contact {
    contact_id: number;
    contact_type: string;
    standing: number;
    label_ids?: number[];
    is_watched?: boolean;
}

let allianceContactsApi: AllianceContactsApi;

beforeAll(() => {
    allianceContactsApi = new AllianceContactsApi(getClient());
});

describe('AllianceContactsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for alliance contacts', async () => {
        const mockResponse: Contact[] = [
            {
                contact_id: 123,
                contact_type: "character",
                standing: 5.0
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await allianceContactsApi.getAllianceContacts(99000006) as Contact[];

        expect(Array.isArray(result)).toBe(true);
        result.forEach((contact: Contact) => {
            expect(contact).toHaveProperty('contact_id');
            expect(typeof contact.contact_id).toBe('number');
            expect(contact).toHaveProperty('contact_type');
            expect(typeof contact.contact_type).toBe('string');
            expect(contact).toHaveProperty('standing');
            expect(typeof contact.standing).toBe('number');

            if (contact.label_ids) {
                expect(Array.isArray(contact.label_ids)).toBe(true);
                contact.label_ids.forEach(label_id => {
                    expect(typeof label_id).toBe('number');
                });
            }

            if (contact.is_watched !== undefined) {
                expect(typeof contact.is_watched).toBe('boolean');
            }
        });
    });
});
