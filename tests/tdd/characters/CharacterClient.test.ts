import { CharacterClient } from '../../../src/clients/CharacterClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();
const client = new ApiClientBuilder()
  .setClientId(config.projectName)
  .setLink(config.link)
  .setAccessToken(process.env.ESI_ACCESS_TOKEN || 'test-token')
  .build();

const characterClient = new CharacterClient(client);

describe('CharacterClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should return valid structure for getCharacterPublicInfo', async () => {
    const mockResponse = {
      character_id: 123,
      name: 'Test Character',
      corporation_id: 456,
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getBody(() =>
      characterClient.getCharacterPublicInfo(123456789),
    );

    expect(result).toHaveProperty('character_id');
    expect(typeof result.character_id).toBe('number');
    expect(result).toHaveProperty('name');
    expect(typeof result.name).toBe('string');
    expect(result).toHaveProperty('corporation_id');
    expect(typeof result.corporation_id).toBe('number');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456789/',
    );
  });

  it('should return valid structure for getCharacterAgentsResearch', async () => {
    const mockResponse = [
      {
        agent_id: 1,
        points_per_day: 1.5,
        remainder_points: 100.0,
        skill_type_id: 123,
        started_at: '2024-07-01T12:00:00Z',
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result: Array<{
      agent_id: number;
      points_per_day: number;
      remainder_points: number;
      skill_type_id: number;
      started_at: string;
    }> = await getBody(() =>
      characterClient.getCharacterAgentsResearch(123456789),
    );

    expect(Array.isArray(result)).toBe(true);
    result.forEach((agent) => {
      expect(agent).toHaveProperty('agent_id');
      expect(typeof agent.agent_id).toBe('number');
      expect(agent).toHaveProperty('points_per_day');
      expect(typeof agent.points_per_day).toBe('number');
      expect(agent).toHaveProperty('remainder_points');
      expect(typeof agent.remainder_points).toBe('number');
      expect(agent).toHaveProperty('skill_type_id');
      expect(typeof agent.skill_type_id).toBe('number');
      expect(agent).toHaveProperty('started_at');
      expect(typeof agent.started_at).toBe('string');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456789/agents_research/',
    );
  });

  it('should return valid structure for getCharacterBlueprints', async () => {
    const mockResponse = [
      {
        item_id: 1,
        type_id: 2,
        location_id: 3,
        location_flag: 'Hangar',
        quantity: 1,
        time_efficiency: 10,
        material_efficiency: 10,
        runs: 5,
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result: Array<{
      item_id: number;
      type_id: number;
      location_id: number;
      location_flag: string;
      quantity: number;
      time_efficiency: number;
      material_efficiency: number;
      runs: number;
    }> = await getBody(() => characterClient.getCharacterBlueprints(123456789));

    expect(Array.isArray(result)).toBe(true);
    result.forEach((blueprint) => {
      expect(blueprint).toHaveProperty('item_id');
      expect(typeof blueprint.item_id).toBe('number');
      expect(blueprint).toHaveProperty('type_id');
      expect(typeof blueprint.type_id).toBe('number');
      expect(blueprint).toHaveProperty('location_id');
      expect(typeof blueprint.location_id).toBe('number');
      expect(blueprint).toHaveProperty('location_flag');
      expect(typeof blueprint.location_flag).toBe('string');
      expect(blueprint).toHaveProperty('quantity');
      expect(typeof blueprint.quantity).toBe('number');
      expect(blueprint).toHaveProperty('time_efficiency');
      expect(typeof blueprint.time_efficiency).toBe('number');
      expect(blueprint).toHaveProperty('material_efficiency');
      expect(typeof blueprint.material_efficiency).toBe('number');
      expect(blueprint).toHaveProperty('runs');
      expect(typeof blueprint.runs).toBe('number');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456789/blueprints/',
    );
  });

  it('should return valid structure for getCharacterCorporationHistory', async () => {
    const mockResponse = [
      {
        corporation_id: 123,
        is_deleted: false,
        record_id: 456,
        start_date: '2024-07-01T12:00:00Z',
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result: Array<{
      corporation_id: number;
      is_deleted: boolean;
      record_id: number;
      start_date: string;
    }> = await getBody(() =>
      characterClient.getCharacterCorporationHistory(123456789),
    );

    expect(Array.isArray(result)).toBe(true);
    result.forEach((history) => {
      expect(history).toHaveProperty('corporation_id');
      expect(typeof history.corporation_id).toBe('number');
      expect(history).toHaveProperty('is_deleted');
      expect(typeof history.is_deleted).toBe('boolean');
      expect(history).toHaveProperty('record_id');
      expect(typeof history.record_id).toBe('number');
      expect(history).toHaveProperty('start_date');
      expect(typeof history.start_date).toBe('string');
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456789/corporationhistory/',
    );
  });

  it('should return valid structure for postCspaChargeCost', async () => {
    const mockResponse = {
      cost: 123456.78,
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const body = {
      characters: [1234567890, 1234567891],
    };

    const result: { cost: number } = await getBody(() =>
      characterClient.postCspaChargeCost(123456, body.characters),
    );

    expect(result).toHaveProperty('cost');
    expect(typeof result.cost).toBe('number');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123456/cspa/',
    );
  });

  it('should return valid structure for getCharacterFatigue', async () => {
    const mockResponse = {
      jump_fatigue_expire_date: '2024-07-01T12:00:00Z',
      last_jump_date: '2024-07-01T11:00:00Z',
      last_update_date: '2024-07-01T12:00:00Z',
    };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));
    const result = await getBody(() =>
      characterClient.getCharacterFatigue(123),
    );
    expect(result).toHaveProperty('last_jump_date');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123/fatigue/',
    );
  });

  it('should return valid structure for getCharacterMedals', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([{ medal_id: 1, title: 'Medal', description: 'A medal' }]),
    );
    const result = await getBody(() => characterClient.getCharacterMedals(123));
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123/medals/',
    );
  });

  it('should return valid structure for getCharacterNotifications', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([
        { notification_id: 1, type: 'AllWarDeclaredMsg', sender_id: 123 },
      ]),
    );
    const result = await getBody(() =>
      characterClient.getCharacterNotifications(123),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123/notifications/',
    );
  });

  it('should return valid structure for getCharacterNotificationsContacts', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([{ notification_id: 1, sender_character_id: 456 }]),
    );
    const result = await getBody(() =>
      characterClient.getCharacterNotificationsContacts(123),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123/notifications/contacts/',
    );
  });

  it('should return valid structure for getCharacterPortrait', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        px64x64: 'https://images.evetech.net/characters/123/portrait?size=64',
        px128x128:
          'https://images.evetech.net/characters/123/portrait?size=128',
      }),
    );
    const result = await getBody(() =>
      characterClient.getCharacterPortrait(123),
    );
    expect(result).toHaveProperty('px64x64');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123/portrait/',
    );
  });

  it('should return valid structure for getCharacterRoles', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ roles: ['Director'], roles_at_hq: [] }),
    );
    const result = await getBody(() => characterClient.getCharacterRoles(123));
    expect(result).toHaveProperty('roles');
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123/roles',
    );
  });

  it('should return valid structure for getCharacterStandings', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([
        { from_id: 500001, from_type: 'faction', standing: 5.0 },
      ]),
    );
    const result = await getBody(() =>
      characterClient.getCharacterStandings(123),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123/standings',
    );
  });

  it('should return valid structure for getCharacterTitles', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([{ title_id: 1, name: 'CEO' }]));
    const result = await getBody(() => characterClient.getCharacterTitles(123));
    expect(Array.isArray(result)).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/123/titles',
    );
  });

  it('should return valid structure for postCharacterAffiliation', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([{ character_id: 123, corporation_id: 456 }]),
    );
    const result = await getBody(() =>
      characterClient.postCharacterAffiliation([123]),
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].character_id).toBe(123);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://esi.evetech.net/latest/characters/affiliation',
    );
  });
});
