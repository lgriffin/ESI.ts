import {
  ACTIVE_PROJECT_ID,
  COMPLETED_PROJECT_ID,
  CURSOR_TOKEN,
  PROJECT_CORPORATION_ID,
} from '../../support/corporation-projects';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return both projects with their progress and the page cursor',
  function () {
    const request = lastRequest();
    expect(request.method).toBe('GET');
    expect(request.url.pathname).toMatch(
      new RegExp(`/corporations/${PROJECT_CORPORATION_ID}/projects/?$`),
    );
    expect(request.headers.authorization).toBe('Bearer bdd-access-token');

    expect(this.result.cursor.after).toBe(CURSOR_TOKEN);
    expect(
      this.result.projects.map((p: any) => [
        p.id,
        p.name,
        p.state,
        p.last_modified,
        p.progress,
      ]),
    ).toEqual([
      [
        ACTIVE_PROJECT_ID,
        'Stock the Jita staging hangar',
        'Active',
        '2026-09-15T18:30:00Z',
        { current: 750, desired: 1000 },
      ],
      [
        COMPLETED_PROJECT_ID,
        'Defend the home complex',
        'Completed',
        '2026-08-01T08:00:00Z',
        { current: 40, desired: 40 },
      ],
    ]);
  },
);
