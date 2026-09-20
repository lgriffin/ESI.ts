import {
  ACTIVE_PROJECT_ID,
  CONTRIBUTOR_CHARACTER_ID,
  PROJECT_CORPORATION_ID,
} from '../../support/corporation-projects';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return the contributed figure and its modification time',
  function () {
    expect(lastRequest().url.pathname).toMatch(
      new RegExp(
        `/corporations/${PROJECT_CORPORATION_ID}/projects/${ACTIVE_PROJECT_ID}/contribution/${CONTRIBUTOR_CHARACTER_ID}/?$`,
      ),
    );
    expect(this.result).toEqual({
      contributed: 500,
      last_modified: '2026-09-15T18:30:00Z',
    });
  },
);
