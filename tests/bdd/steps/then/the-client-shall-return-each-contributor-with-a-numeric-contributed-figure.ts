import {
  ACTIVE_PROJECT_ID,
  CONTRIBUTOR_CHARACTER_ID,
  CURSOR_TOKEN,
  PROJECT_CORPORATION_ID,
  SECOND_CONTRIBUTOR_CHARACTER_ID,
} from '../../support/corporation-projects';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return each contributor with a numeric contributed figure',
  function () {
    expect(lastRequest().url.pathname).toMatch(
      new RegExp(
        `/corporations/${PROJECT_CORPORATION_ID}/projects/${ACTIVE_PROJECT_ID}/contributors/?$`,
      ),
    );
    expect(this.result.cursor).toEqual({ after: CURSOR_TOKEN });
    expect(this.result.contributors).toEqual([
      {
        id: CONTRIBUTOR_CHARACTER_ID,
        name: 'First Contributor',
        contributed: 500,
      },
      {
        id: SECOND_CONTRIBUTOR_CHARACTER_ID,
        name: 'Second Contributor',
        contributed: 300,
      },
    ]);
    for (const entry of this.result.contributors) {
      expect(typeof entry.id).toBe('number');
      expect(typeof entry.contributed).toBe('number');
    }
  },
);
