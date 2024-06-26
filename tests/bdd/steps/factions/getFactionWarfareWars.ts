import { loadFeature, defineFeature } from 'jest-cucumber';
import fetchMock from 'jest-fetch-mock';
import { ApiClient } from '../../../../src/core/ApiClient';
import { FactionWarfareWarsApi } from '../../../../src/api/factions/getFactionWarfareWars';

const feature = loadFeature('tests/bdd/features/factions/getFactionWarfareWars.feature');

defineFeature(feature, (test) => {
  let response: any;
  let api: FactionWarfareWarsApi;

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('Retrieve faction warfare wars', ({ given, when, then }) => {
    given('faction warfare wars are available', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({
        wars: [{ war_id: 1, faction_id: 500001 }]
      }));
      api = new FactionWarfareWarsApi(new ApiClient('clientId', 'https://esi.evetech.net'));
    });

    when('the wars are requested', async () => {
      response = await api.getWars();
    });

    then('the response should contain the wars data', () => {
      expect(response.wars[0].war_id).toBe(1);
      expect(response.wars[0].faction_id).toBe(500001);
    });
  });
});
