import {
  ACTIVE_PROJECT_ID,
  CONTRIBUTOR_CHARACTER_ID,
  PROJECT_CORPORATION_ID,
} from '../../support/corporation-projects';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return the project creator, details and configuration',
  function () {
    const request = lastRequest();
    expect(request.url.pathname).toMatch(
      new RegExp(
        `/corporations/${PROJECT_CORPORATION_ID}/projects/${ACTIVE_PROJECT_ID}/?$`,
      ),
    );
    expect(request.headers.authorization).toBe('Bearer bdd-access-token');

    expect(this.result).toMatchObject({
      id: ACTIVE_PROJECT_ID,
      name: 'Stock the Jita staging hangar',
      state: 'Active',
      progress: { current: 750, desired: 1000 },
      creator: { id: CONTRIBUTOR_CHARACTER_ID, name: 'Project Creator' },
      details: {
        career: 'Industrialist',
        created: '2026-09-01T12:00:00Z',
        description: 'Deliver hulls to the staging hangar.',
      },
      configuration: { manual: {} },
    });
  },
);
