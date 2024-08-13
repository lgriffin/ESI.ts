import { GetCharacterFittingsApi } from '../../../src/api/fittings/getCharacterFittings';
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

const characterFittingsApi = new GetCharacterFittingsApi(client);

describe('GetCharacterFittingsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character fittings', async () => {
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

        const result = await getBody(() => characterFittingsApi.getFittings(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((fitting: { fitting_id: number, name: string, description: string, ship_type_id: number, items: Array<{ flag: string, quantity: number, type_id: number }> }) => {
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
});
