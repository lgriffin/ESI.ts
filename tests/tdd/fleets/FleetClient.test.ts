import { FleetClient } from '../../../src/clients/FleetClient';
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

const fleetClient = new FleetClient(client);

describe('FleetClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getCharacterFleetInfo', async () => {
        const mockResponse = {
            fleet_id: 1234567890,
            role: 'fleet_commander',
            squad_id: 1,
            wing_id: 2
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await fleetClient.getCharacterFleetInfo(123456789);

        expect(result).toHaveProperty('fleet_id');
        expect(result).toHaveProperty('role');
        expect(result).toHaveProperty('squad_id');
        expect(result).toHaveProperty('wing_id');
    });

    it('should return valid structure for getFleetInformation', async () => {
        const mockResponse = {
            fleet_id: 1234567890,
            is_free_move: false,
            is_registered: false,
            is_voice_enabled: true,
            motd: 'Fleet Message'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await fleetClient.getFleetInformation(1234567890);

        expect(result).toHaveProperty('fleet_id');
        expect(result).toHaveProperty('is_free_move');
        expect(result).toHaveProperty('is_registered');
        expect(result).toHaveProperty('is_voice_enabled');
        expect(result).toHaveProperty('motd');
    });

    it('should update the fleet information', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = { is_free_move: true };

        const result = await fleetClient.updateFleet(1234567890, body);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should return valid structure for getFleetMembers', async () => {
        const mockResponse = [
            {
                character_id: 123,
                join_time: '2024-07-01T12:00:00Z',
                role: 'fleet_commander',
                role_name: 'Fleet Commander',
                ship_type_id: 456,
                solar_system_id: 789,
                squad_id: 1,
                station_id: 2,
                takes_fleet_warp: true,
                wing_id: 3
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await fleetClient.getFleetMembers(1234567890);

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(member => {
            expect(member).toHaveProperty('character_id');
            expect(member).toHaveProperty('join_time');
            expect(member).toHaveProperty('role');
            expect(member).toHaveProperty('role_name');
            expect(member).toHaveProperty('ship_type_id');
            expect(member).toHaveProperty('solar_system_id');
            expect(member).toHaveProperty('squad_id');
            expect(member).toHaveProperty('station_id');
            expect(member).toHaveProperty('takes_fleet_warp');
            expect(member).toHaveProperty('wing_id');
        });
    });

    it('should create a fleet invitation', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = { character_id: 123456, role: 'squad_member' };

        const result = await fleetClient.createFleetInvitation(1234567890, body);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should kick a fleet member', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await fleetClient.kickFleetMember(1234567890, 123456789);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should move a fleet member', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = { role: 'squad_member', squad_id: 1, wing_id: 2 };

        const result = await fleetClient.moveFleetMember(1234567890, 123456789, body);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should delete a fleet squad', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await fleetClient.deleteFleetSquad(1234567890, 1);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should rename a fleet squad', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await fleetClient.renameFleetSquad(1234567890, 1, 'New Squad Name');

        expect(result).toEqual({ error: 'no content' });
    });

    it('should return fleet wings', async () => {
        const mockResponse = [
            {
                id: 1,
                name: 'Wing 1',
                squads: [
                    {
                        id: 2,
                        name: 'Squad 1'
                    }
                ]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await fleetClient.getFleetWings(1234567890);

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(wing => {
            expect(wing).toHaveProperty('id');
            expect(wing).toHaveProperty('name');
            expect(Array.isArray(wing.squads)).toBe(true);
            wing.squads.forEach((squad: any) => {
                expect(squad).toHaveProperty('id');
                expect(squad).toHaveProperty('name');
            });
        });
    });

    it('should create a fleet wing', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = { name: 'New Wing' };

        const result = await fleetClient.createFleetWing(1234567890, body);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should delete a fleet wing', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await fleetClient.deleteFleetWing(1234567890, 1);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should rename a fleet wing', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await fleetClient.renameFleetWing(1234567890, 1, 'New Wing Name');

        expect(result).toEqual({ error: 'no content' });
    });

    it('should create a fleet squad', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await fleetClient.createFleetSquad(1234567890, 1);

        expect(result).toEqual({ error: 'no content' });
    });
});
