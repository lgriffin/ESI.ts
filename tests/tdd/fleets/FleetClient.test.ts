import { FleetClient } from '../../../src/clients/FleetClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();
const client = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
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
      wing_id: 2,
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      fleetClient.getCharacterFleetInfo(123456789),
    );

    expect(result).toHaveProperty('fleet_id');
    expect(result).toHaveProperty('role');
    expect(result).toHaveProperty('squad_id');
    expect(result).toHaveProperty('wing_id');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456789/fleet',
    );
  });

  it('should return valid structure for getFleetInformation', async () => {
    const mockResponse = {
      fleet_id: 1234567890,
      is_free_move: false,
      is_registered: false,
      is_voice_enabled: true,
      motd: 'Fleet Message',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      fleetClient.getFleetInformation(1234567890),
    );

    expect(result).toHaveProperty('fleet_id');
    expect(result).toHaveProperty('is_free_move');
    expect(result).toHaveProperty('is_registered');
    expect(result).toHaveProperty('is_voice_enabled');
    expect(result).toHaveProperty('motd');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890',
    );
  });

  it('should update the fleet information', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const body = { is_free_move: true };

    const result = await getBody(() =>
      fleetClient.updateFleet(1234567890, body),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890',
    );
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
        wing_id: 3,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => fleetClient.getFleetMembers(1234567890));

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty('character_id');
    expect(result[0]).toHaveProperty('join_time');
    expect(result[0]).toHaveProperty('role');
    expect(result[0]).toHaveProperty('role_name');
    expect(result[0]).toHaveProperty('ship_type_id');
    expect(result[0]).toHaveProperty('solar_system_id');
    expect(result[0]).toHaveProperty('squad_id');
    expect(result[0]).toHaveProperty('station_id');
    expect(result[0]).toHaveProperty('takes_fleet_warp');
    expect(result[0]).toHaveProperty('wing_id');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/members',
    );
  });

  it('should create a fleet invitation', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const body = { character_id: 123456, role: 'squad_member' };

    const result = await getBody(() =>
      fleetClient.createFleetInvitation(1234567890, body),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/members/',
    );
  });

  it('should kick a fleet member', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const result = await getBody(() =>
      fleetClient.kickFleetMember(1234567890, 123456789),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/members/123456789/',
    );
  });

  it('should move a fleet member', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const body = { role: 'squad_member', squad_id: 1, wing_id: 2 };

    const result = await getBody(() =>
      fleetClient.moveFleetMember(1234567890, 123456789, body),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/members/123456789/',
    );
  });

  it('should delete a fleet squad', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const result = await getBody(() =>
      fleetClient.deleteFleetSquad(1234567890, 1),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/squads/1/',
    );
  });

  it('should rename a fleet squad', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const result = await getBody(() =>
      fleetClient.renameFleetSquad(1234567890, 1, 'New Squad'),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/squads/1/',
    );
  });

  it('should return fleet wings', async () => {
    const mockResponse = [
      {
        id: 1,
        name: 'Wing 1',
        squads: [
          {
            id: 2,
            name: 'Squad 1',
          },
        ],
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() => fleetClient.getFleetWings(1234567890));

    expect(Array.isArray(result)).toBe(true);
    const wings = result;
    expect(wings[0]).toHaveProperty('id');
    expect(wings[0]).toHaveProperty('name');
    expect(Array.isArray(wings[0].squads)).toBe(true);
    expect(wings[0].squads[0]).toHaveProperty('id');
    expect(wings[0].squads[0]).toHaveProperty('name');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/wings/',
    );
  });

  it('should create a fleet wing', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const body = { name: 'New Wing' };

    const result = await getBody(() =>
      fleetClient.createFleetWing(1234567890, body),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/wings/',
    );
  });

  it('should delete a fleet wing', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const result = await getBody(() =>
      fleetClient.deleteFleetWing(1234567890, 1),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/wings/1/',
    );
  });

  it('should rename a fleet wing', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const result = await getBody(() =>
      fleetClient.renameFleetWing(1234567890, 1, 'New Wing'),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/wings/1/',
    );
  });

  it('should reject squad names exceeding 10 characters', async () => {
    await expect(
      fleetClient.renameFleetSquad(1234567890, 1, 'Way Too Long Name'),
    ).rejects.toThrow('exceeds ESI maximum of 10 characters');
  });

  it('should reject wing names exceeding 10 characters', async () => {
    await expect(
      fleetClient.renameFleetWing(1234567890, 1, 'Way Too Long Name'),
    ).rejects.toThrow('exceeds ESI maximum of 10 characters');
  });

  it('should create a fleet squad', async () => {
    fetchMock.mockResponseOnce('', { status: 204 });

    const result = await getBody(() =>
      fleetClient.createFleetSquad(1234567890, 1),
    );

    expect(result).toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/fleets/1234567890/wings/1/squads/',
    );
  });
});
