import { loadFeature, defineFeature } from 'jest-cucumber';
import fetchMock from 'jest-fetch-mock';
import { ApiClient } from '../../../../src/core/ApiClient';
import { FactionWarfareSystemsApi } from '../../../../src/api/factions/getFactionWarfareSystems';

const feature = loadFeature('tests/bdd/features/factions/getFactionWarfareSystems.feature');

defineFeature(feature, (test) => {
  let response: any;
  let api: FactionWarfareSystemsApi;

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('Retrieve faction warfare systems', ({ given, when, then }) => {
    given('faction warfare systems are available', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({
        systems: [{ system_id: 30000142, occupier_faction_id: 500001 }]
      }));
      api = new FactionWarfareSystemsApi(new ApiClient('clientId', 'https://esi.evetech.net'));
    });

    when('the systems are requested', async () => {
      response = await api.getSystems();
    });

    then('the response should contain the systems data', () => {
      expect(response.systems[0].system_id).toBe(30000142);
      expect(response.systems[0].occupier_faction_id).toBe(500001);
    });
  });
});
