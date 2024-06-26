import { loadFeature, defineFeature } from 'jest-cucumber';
import fetchMock from 'jest-fetch-mock';
import { ApiClient } from '../../../../src/core/ApiClient';
import { FactionWarfareStatsApi } from '../../../../src/api/factions/getFactionWarfareStats';

const feature = loadFeature('tests/bdd/features/factions/getFactionWarfareStats.feature');

defineFeature(feature, (test) => {
  let response: any;
  let api: FactionWarfareStatsApi;

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('Retrieve faction warfare statistics', ({ given, when, then }) => {
    given('faction warfare stats are available', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({
        kills: { total: 1000 },
        victory_points: { total: 2000 },
      }));
      api = new FactionWarfareStatsApi(new ApiClient('clientId', 'https://esi.evetech.net'));
    });

    when('the stats are requested', async () => {
      response = await api.getStats();
    });

    then('the response should contain the stats data', () => {
      expect(response.kills.total).toBe(1000);
      expect(response.victory_points.total).toBe(2000);
    });
  });
});
