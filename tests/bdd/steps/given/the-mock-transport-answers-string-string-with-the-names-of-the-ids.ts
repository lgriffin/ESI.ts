import { namesOfIds, transportOf } from '../../support/mock-transport';
import { Given } from '../../support/steps';

Given(
  'the mock transport answers {string} {string} with the names of the IDs',
  function (method: string, path: string) {
    transportOf(this).respond({ method, path, body: namesOfIds() });
  },
);
