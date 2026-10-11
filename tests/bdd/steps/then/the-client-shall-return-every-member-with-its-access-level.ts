import {
  ACCESS_LIST_OWNER_ID,
  MIXED_ACCESS_LIST_ID,
  accessListFixtures,
  accessListPaths,
} from '../../support/access-lists';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return every member with its access level', function () {
  const request = lastRequest();
  expect(request.method).toBe('GET');
  expect(request.url.pathname).toContain(
    accessListPaths.list(ACCESS_LIST_OWNER_ID, MIXED_ACCESS_LIST_ID),
  );
  expect(request.headers.authorization).toBe('Bearer bdd-access-token');

  expect(this.result.id).toBe(MIXED_ACCESS_LIST_ID);
  expect(this.result.name).toBe('Station Docking ACL');
  expect(this.result.description).toBe('Who may dock at the staging Fortizar');
  expect(this.result.membership).toEqual(accessListFixtures.mixedMembership());
  const { alliances, corporations, characters } = this.result.membership;
  expect([
    ...alliances.map((m: any) => [m.alliance_id, m.access]),
    ...corporations.map((m: any) => [m.corporation_id, m.access]),
    ...characters.map((m: any) => [m.character_id, m.access]),
  ]).toEqual([
    [99000001, 'Blocked'],
    [98000002, 'Allowed'],
    [1689391488, 'Admin'],
  ]);
});
