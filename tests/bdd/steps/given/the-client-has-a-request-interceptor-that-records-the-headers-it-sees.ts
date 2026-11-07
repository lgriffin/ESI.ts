import { recordRequests } from '../../support/pipeline-edges';
import { Given } from '../../support/steps';

Given(
  'the client has a request interceptor that records the headers it sees',
  function () {
    recordRequests(this);
  },
);
