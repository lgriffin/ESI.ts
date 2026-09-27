import { transportOf } from '../../support/mock-transport';
import { Given } from '../../support/steps';

Given(
  'the mock transport answers {string} {string} with status {int}',
  function (method: string, path: string, status: number) {
    transportOf(this).respond({
      method,
      path,
      status,
      body: { error: `status ${status} from the route table` },
    });
  },
);
