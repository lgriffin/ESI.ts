import { PROJECT_LIST_PATH, project } from '../../support/custom-endpoints';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given(
  'ESI lists the corporation projects {string} and {string} with the cursors {string} and {string}',
  function (first: string, second: string, before: string, after: string) {
    queueResponse({
      match: PROJECT_LIST_PATH,
      headers: { 'x-cursor-before': before, 'x-cursor-after': after },
      body: [project(first), project(second)],
    });
  },
);
