import {
  ACCESS_LIST_OWNER_ID,
  MIXED_ACCESS_LIST_ID,
  accessListFixtures,
  accessListPaths,
} from '../../support/access-lists';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return all entries with their access types',
  function () {
    const request = lastRequest();
    expect(request.method).toBe('GET');
    expect(request.url.pathname).toContain(
      accessListPaths.list(ACCESS_LIST_OWNER_ID, MIXED_ACCESS_LIST_ID),
    );
    expect(request.headers.authorization).toBe('Bearer bdd-access-token');

    expect(this.result.access_list_id).toBe(MIXED_ACCESS_LIST_ID);
    expect(this.result.name).toBe('Station Docking ACL');
    expect(this.result.entries).toEqual(accessListFixtures.mixedEntries());
    expect(
      this.result.entries.map((e: any) => [e.entity_type, e.access_type]),
    ).toEqual([
      ['character', 'allowed'],
      ['corporation', 'allowed'],
      ['alliance', 'blocked'],
    ]);
  },
);
