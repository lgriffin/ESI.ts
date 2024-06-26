import { loadFeature, defineFeature } from 'jest-cucumber';
import fetchMock from 'jest-fetch-mock';
import { ApiClient } from '../../../../src/core/ApiClient';
import { FactionWarfareLeaderboardsApi } from '../../../../src/api/factions/getFactionWarfareLeaderboards';

const feature = loadFeature('tests/bdd/features/factions/getFactionWarfareLeaderboards.feature');

defineFeature(feature, (test) => {
  let response: any;
  let api: FactionWarfareLeaderboardsApi;

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('Fetching faction warfare leaderboards', ({ given, when, then }) => {
    given('faction warfare leaderboards are available', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({
        characters: { kills: { yesterday: 10, last_week: 70, total: 300 } },
        corporations: { kills: { yesterday: 15, last_week: 80, total: 350 } },
      }));
      api = new FactionWarfareLeaderboardsApi(new ApiClient('clientId', 'https://esi.evetech.net'));
    });

    when('the leaderboards are requested', async () => {
      response = await api.getCharacters();
    });

    then('the response should contain the leaderboards data', () => {
      expect(response.characters.kills.total).toBe(300);
    });
  });
});
