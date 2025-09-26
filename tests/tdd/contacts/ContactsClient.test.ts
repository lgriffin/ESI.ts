import { ContactsClient } from '../../../src/clients/ContactsClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('ContactsClient', () => {
    let contactsClient: ContactsClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        
        const config = getConfig();
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        contactsClient = new ContactsClient(client);
    });

    describe('Alliance Contacts', () => {
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

            const result = await getBody(() => contactsClient.getAllianceContacts(123456));

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

            const result = await getBody(() => contactsClient.getAllianceContactLabels(123456));

            expect(Array.isArray(result)).toBe(true);
            (result as any[]).forEach(label => {
                expect(label).toHaveProperty('label_id');
                expect(label).toHaveProperty('name');
            });
        });
    });

    describe('Character Contacts', () => {
        it('should return valid structure for getCharacterContacts', async () => {
            const mockResponse = [
                {
                    contact_id: 123456789,
                    contact_type: 'character',
                    standing: 5.0,
                    label_ids: [1],
                    is_watched: false,
                    is_blocked: false
                },
                {
                    contact_id: 987654321,
                    contact_type: 'corporation',
                    standing: -10.0,
                    label_ids: [2, 3],
                    is_watched: true,
                    is_blocked: true
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => contactsClient.getCharacterContacts(123456));

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);

            expect(result[0].contact_id).toBe(123456789);
            expect(result[0].contact_type).toBe('character');
            expect(result[0].standing).toBe(5.0);
            expect(result[0].label_ids).toEqual([1]);
            expect(result[0].is_watched).toBe(false);
            expect(result[0].is_blocked).toBe(false);

            expect(result[1].contact_id).toBe(987654321);
            expect(result[1].contact_type).toBe('corporation');
            expect(result[1].standing).toBe(-10.0);
            expect(result[1].label_ids).toEqual([2, 3]);
            expect(result[1].is_watched).toBe(true);
            expect(result[1].is_blocked).toBe(true);
        });

        it('should return valid structure for getCharacterContactLabels', async () => {
            const mockResponse = [
                {
                    label_id: 1,
                    name: 'Friends'
                },
                {
                    label_id: 2,
                    name: 'Enemies'
                },
                {
                    label_id: 3,
                    name: 'Neutrals'
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => contactsClient.getCharacterContactLabels(123456));

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(3);

            result.forEach((label: any) => {
                expect(label).toHaveProperty('label_id');
                expect(label).toHaveProperty('name');
                expect(typeof label.label_id).toBe('number');
                expect(typeof label.name).toBe('string');
            });
        });

        it('should handle postCharacterContacts (add contacts)', async () => {
            const mockResponse = [123456789, 987654321]; // Contact IDs that were added
            const contactsToAdd = [
                {
                    contact_id: 123456789,
                    contact_type: 'character',
                    standing: 5.0,
                    label_ids: [1]
                },
                {
                    contact_id: 987654321,
                    contact_type: 'corporation',
                    standing: -5.0,
                    label_ids: [2]
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => contactsClient.postCharacterContacts(123456, contactsToAdd));

            expect(Array.isArray(result)).toBe(true);
            expect(result).toEqual([123456789, 987654321]);
        });

        it('should handle putCharacterContacts (edit contacts)', async () => {
            const mockResponse = {}; // PUT typically returns empty response on success
            const contactsToUpdate = [
                {
                    contact_id: 123456789,
                    standing: 10.0,
                    label_ids: [1, 2]
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => contactsClient.putCharacterContacts(123456, contactsToUpdate));

            expect(result).toEqual({});
        });

        it('should handle deleteCharacterContacts', async () => {
            const mockResponse = {}; // DELETE typically returns empty response on success
            const contactIdsToDelete = [123456789, 987654321];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => contactsClient.deleteCharacterContacts(123456, contactIdsToDelete));

            expect(result).toEqual({});
        });
    });

    describe('Corporation Contacts', () => {
        it('should return valid structure for getCorporationContacts', async () => {
            const mockResponse = [
                {
                    contact_id: 123456789,
                    contact_type: 'alliance',
                    standing: 10.0,
                    label_ids: [1],
                    is_watched: false
                },
                {
                    contact_id: 987654321,
                    contact_type: 'corporation',
                    standing: 0.0,
                    label_ids: [],
                    is_watched: true
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => contactsClient.getCorporationContacts(123456789));

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);

            result.forEach((contact: any) => {
                expect(contact).toHaveProperty('contact_id');
                expect(contact).toHaveProperty('contact_type');
                expect(contact).toHaveProperty('standing');
                expect(contact).toHaveProperty('label_ids');
                expect(contact).toHaveProperty('is_watched');
                expect(typeof contact.contact_id).toBe('number');
                expect(typeof contact.standing).toBe('number');
                expect(Array.isArray(contact.label_ids)).toBe(true);
                expect(typeof contact.is_watched).toBe('boolean');
            });
        });

        it('should return valid structure for getCorporationContactLabels', async () => {
            const mockResponse = [
                {
                    label_id: 1,
                    name: 'Corporate Allies'
                },
                {
                    label_id: 2,
                    name: 'Trade Partners'
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => contactsClient.getCorporationContactLabels(123456789));

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);

            result.forEach((label: any) => {
                expect(label).toHaveProperty('label_id');
                expect(label).toHaveProperty('name');
                expect(typeof label.label_id).toBe('number');
                expect(typeof label.name).toBe('string');
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle authentication errors', async () => {
            fetchMock.mockResponseOnce('Unauthorized', { status: 401 });

            const result = await getBody(() => contactsClient.getCharacterContacts(123456));
            expect(result).toHaveProperty('error');
            expect(result.error).toBe('unauthorized');
        });

        it('should handle forbidden access errors', async () => {
            fetchMock.mockResponseOnce('Forbidden', { status: 403 });

            const result = await getBody(() => contactsClient.getCorporationContacts(123456789));
            expect(result).toHaveProperty('error');
            expect(result.error).toBe('forbidden');
        });

        it('should handle not found errors', async () => {
            fetchMock.mockResponseOnce('Not Found', { status: 404 });

            const result = await getBody(() => contactsClient.getAllianceContacts(999999999));
            expect(result).toHaveProperty('error');
            expect(result.error).toBe('resource not found');
        });
    });
});
