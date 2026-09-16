import {
  PROJECT_CORPORATION_ID,
  UNKNOWN_PROJECT_ID,
  projectPaths,
} from '../../support/corporation-projects';
import { queueError } from '../../support/transport';
import { Given } from '../../support/steps';

Given('an unknown corporation project ID', function () {
  queueError(404, 'Project not found', {
    match: projectPaths.detail(PROJECT_CORPORATION_ID, UNKNOWN_PROJECT_ID),
  });
});
