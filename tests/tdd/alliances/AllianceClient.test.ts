import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { AllianceClient } from '../../../src/clients/AllianceClient';
import { getConfig } from '../../../src/config/configManager';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('AllianceClient', () => {
    let allianceClient: AllianceClient;

    beforeEach(() => {
        fetchMock.resetMocks();
        
        const config = getConfig();
        const client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();

        allianceClient = new AllianceClient(client);
    });

    describe('getAllianceById', () => {
        it('should return valid alliance information', async () => {
            const allianceId = 99005338;
            const mockResponse = { 
                alliance_id: allianceId, 
                name: 'Goonswarm Federation',
                ticker: 'CONDI',
                creator_id: 12345,
                creator_corporation_id: 67890,
                date_founded: '2010-05-23T05:20:00Z'
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => allianceClient.getAllianceById(allianceId));
            
            expect(result.alliance_id).toBe(allianceId);
            expect(result.name).toBe('Goonswarm Federation');
            expect(result.ticker).toBe('CONDI');
            expect(result.creator_id).toBe(12345);
            expect(result.creator_corporation_id).toBe(67890);
            expect(result.date_founded).toBe('2010-05-23T05:20:00Z');
        });

        it('should handle API errors gracefully', async () => {
            const allianceId = 99999999;
            fetchMock.mockResponseOnce('Not Found', { status: 404 });

            const result = await getBody(() => allianceClient.getAllianceById(allianceId));
            expect(result).toHaveProperty('error');
            expect(result.error).toBe('resource not found');
        });
    });

    describe('getContacts', () => {
        it('should return valid alliance contacts', async () => {
            const allianceId = 99005338;
            const mockResponse = [
                {
                    contact_id: 123456,
                    contact_type: 'character',
                    standing: 10.0,
                    label_ids: [1, 2]
                },
                {
                    contact_id: 789012,
                    contact_type: 'corporation',
                    standing: -5.0,
                    label_ids: [3]
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => allianceClient.getContacts(allianceId));
            
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
            
            expect(result[0].contact_id).toBe(123456);
            expect(result[0].contact_type).toBe('character');
            expect(result[0].standing).toBe(10.0);
            expect(result[0].label_ids).toEqual([1, 2]);
            
            expect(result[1].contact_id).toBe(789012);
            expect(result[1].contact_type).toBe('corporation');
            expect(result[1].standing).toBe(-5.0);
            expect(result[1].label_ids).toEqual([3]);
        });
    });

    describe('getContactLabels', () => {
        it('should return valid alliance contact labels', async () => {
            const allianceId = 99005338;
            const mockResponse = [
                {
                    label_id: 1,
                    name: 'Allies'
                },
                {
                    label_id: 2,
                    name: 'Neutrals'
                },
                {
                    label_id: 3,
                    name: 'Enemies'
                }
            ];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => allianceClient.getContactLabels(allianceId));
            
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(3);
            
            expect(result[0].label_id).toBe(1);
            expect(result[0].name).toBe('Allies');
            expect(result[1].label_id).toBe(2);
            expect(result[1].name).toBe('Neutrals');
            expect(result[2].label_id).toBe(3);
            expect(result[2].name).toBe('Enemies');
        });
    });

    describe('getCorporations', () => {
        it('should return valid alliance corporation IDs', async () => {
            const allianceId = 99005338;
            const mockResponse = [1344654522, 98306624, 1727758877, 98409330];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => allianceClient.getCorporations(allianceId));
            
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(4);
            expect(result).toEqual([1344654522, 98306624, 1727758877, 98409330]);
            
            // Verify all entries are numbers
            result.forEach((corpId: number) => {
                expect(typeof corpId).toBe('number');
            });
        });
    });

    describe('getIcons', () => {
        it('should return valid alliance icon URLs', async () => {
            const allianceId = 99005338;
            const mockResponse = {
                px64x64: 'https://images.evetech.net/alliances/99005338/logo?size=64',
                px128x128: 'https://images.evetech.net/alliances/99005338/logo?size=128'
            };

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            const result = await getBody(() => allianceClient.getIcons(allianceId));
            
            expect(result.px64x64).toBe('https://images.evetech.net/alliances/99005338/logo?size=64');
            expect(result.px128x128).toBe('https://images.evetech.net/alliances/99005338/logo?size=128');
        });
    });

    describe('getAlliances', () => {
        it('should return valid list of all alliance IDs', async () => {
            const mockResponse = [99005338, 99005551, 99010079, 99011978];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            // getAlliances uses handleRequestBody, so it returns the body directly
            const result = await allianceClient.getAlliances();
            
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            
            // Verify all entries are numbers (alliance IDs)
            result.forEach((allianceId: number) => {
                expect(typeof allianceId).toBe('number');
                expect(allianceId).toBeGreaterThan(0);
            });
        });

        it('should handle empty alliance list', async () => {
            const mockResponse: number[] = [];

            fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

            // getAlliances uses handleRequestBody, so it returns the body directly
            const result = await allianceClient.getAlliances();
            
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });
    });
});
