import { PIClient } from '../../../src/clients/PiClient';
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

const piClient = new PIClient(client);

describe('PIClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getColonies', async () => {
        const mockResponse = [
            {
                planet_id: 123456,
                planet_type: 'temperate',
                owner_id: 987654,
                system_id: 654321,
                last_update: '2024-01-01T00:00:00Z',
                num_pins: 10,
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => piClient.getColonies(123456));

        expect(Array.isArray(result)).toBe(true);
        (result as { planet_id: number, planet_type: string, owner_id: number, system_id: number, last_update: string, num_pins: number }[]).forEach(colony => {
            expect(colony).toHaveProperty('planet_id');
            expect(typeof colony.planet_id).toBe('number');
            expect(colony).toHaveProperty('planet_type');
            expect(typeof colony.planet_type).toBe('string');
            expect(colony).toHaveProperty('owner_id');
            expect(typeof colony.owner_id).toBe('number');
            expect(colony).toHaveProperty('system_id');
            expect(typeof colony.system_id).toBe('number');
            expect(colony).toHaveProperty('last_update');
            expect(typeof colony.last_update).toBe('string');
            expect(colony).toHaveProperty('num_pins');
            expect(typeof colony.num_pins).toBe('number');
        });
    });

    it('should return valid structure for getColonyLayout', async () => {
        const mockResponse = {
            links: [
                { source_pin_id: 1001, destination_pin_id: 1002, link_level: 1 }
            ],
            pins: [
                {
                    pin_id: 1001,
                    type_id: 3001,
                    latitude: 0.5,
                    longitude: -0.5,
                    schematic_id: 4001,
                }
            ],
            routes: [
                { route_id: 2001, source_pin_id: 1001, destination_pin_id: 1002, content_type_id: 3001, quantity: 500 }
            ]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => piClient.getColonyLayout(123456, 654321));

        expect(result).toHaveProperty('links');
        expect(Array.isArray(result.links)).toBe(true);
        expect(result).toHaveProperty('pins');
        expect(Array.isArray(result.pins)).toBe(true);
        expect(result).toHaveProperty('routes');
        expect(Array.isArray(result.routes)).toBe(true);
    });

    it('should return valid structure for getCorporationCustomsOffices', async () => {
        const mockResponse = [
            {
                office_id: 123456,
                system_id: 654321,
                reinforce_exit_start: 2,
                reinforce_exit_end: 14,
                allow_alliance_access: true,
                tax_rate: 0.05,
                alliance_tax_rate: 0.02,
                corp_tax_rate: 0.01
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => piClient.getCorporationCustomsOffices(123456));

        expect(Array.isArray(result)).toBe(true);
        (result as {
            office_id: number,
            system_id: number,
            reinforce_exit_start: number,
            reinforce_exit_end: number,
            allow_alliance_access: boolean,
            tax_rate: number,
            alliance_tax_rate: number,
            corp_tax_rate: number
        }[]).forEach(office => {
            expect(office).toHaveProperty('office_id');
            expect(typeof office.office_id).toBe('number');
            expect(office).toHaveProperty('system_id');
            expect(typeof office.system_id).toBe('number');
            expect(office).toHaveProperty('reinforce_exit_start');
            expect(typeof office.reinforce_exit_start).toBe('number');
            expect(office).toHaveProperty('reinforce_exit_end');
            expect(typeof office.reinforce_exit_end).toBe('number');
            expect(office).toHaveProperty('allow_alliance_access');
            expect(typeof office.allow_alliance_access).toBe('boolean');
            expect(office).toHaveProperty('tax_rate');
            expect(typeof office.tax_rate).toBe('number');
            expect(office).toHaveProperty('alliance_tax_rate');
            expect(typeof office.alliance_tax_rate).toBe('number');
            expect(office).toHaveProperty('corp_tax_rate');
            expect(typeof office.corp_tax_rate).toBe('number');
        });
    });

    it('should return valid structure for getSchematicInformation', async () => {
        const mockResponse = {
            schematic_id: 1,
            schematic_name: 'Test Schematic',
            cycle_time: 300,
            output_quantity: 10
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => piClient.getSchematicInformation(1));

        expect(result).toHaveProperty('schematic_id');
        expect(typeof result.schematic_id).toBe('number');
        expect(result).toHaveProperty('schematic_name');
        expect(typeof result.schematic_name).toBe('string');
        expect(result).toHaveProperty('cycle_time');
        expect(typeof result.cycle_time).toBe('number');
        expect(result).toHaveProperty('output_quantity');
        expect(typeof result.output_quantity).toBe('number');
    });
});
