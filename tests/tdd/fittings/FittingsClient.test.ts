// tests/tdd/clients/FittingsClient.test.ts

import { FittingsClient } from '../../../src/clients/FittingsClient';
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

const fittingsClient = new FittingsClient(client);

describe('FittingsClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getFittings', async () => {
        const mockResponse = [
            {
                fitting_id: 1,
                name: 'Test Fitting',
                description: 'Test Description',
                ship_type_id: 123,
                items: [
                    {
                        flag: 'HIGH_SLOT_1',
                        quantity: 1,
                        type_id: 456
                    }
                ]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await fittingsClient.getFittings(123456);

        expect(Array.isArray(result)).toBe(true);
        (result as { fitting_id: number, name: string, description: string, ship_type_id: number, items: Array<{ flag: string, quantity: number, type_id: number }> }[]).forEach(fitting => {
            expect(fitting).toHaveProperty('fitting_id');
            expect(fitting).toHaveProperty('name');
            expect(fitting).toHaveProperty('description');
            expect(fitting).toHaveProperty('ship_type_id');
            expect(Array.isArray(fitting.items)).toBe(true);
            fitting.items.forEach(item => {
                expect(item).toHaveProperty('flag');
                expect(item).toHaveProperty('quantity');
                expect(item).toHaveProperty('type_id');
            });
        });
    });

    it('should create a fitting', async () => {
        const mockResponse = {
            fitting_id: 1
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const fittingData = {
            name: 'Test Fitting',
            description: 'Test Description',
            ship_type_id: 123,
            items: [
                {
                    flag: 'HIGH_SLOT_1',
                    quantity: 1,
                    type_id: 456
                }
            ]
        };

        const result = await fittingsClient.createFitting(123456, fittingData);

        expect(result).toHaveProperty('fitting_id');
        expect(typeof result.fitting_id).toBe('number');
    });

    it('should delete a fitting', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await fittingsClient.deleteFitting(123456, 1);

        expect(result).toEqual({ error: 'no content' });
    });
});