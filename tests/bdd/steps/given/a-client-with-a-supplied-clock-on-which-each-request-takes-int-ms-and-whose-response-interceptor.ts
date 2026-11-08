import { clientRecordingResponses } from '../../support/pipeline-edges';
import { Given } from '../../support/steps';

Given(
  'a client with a supplied clock on which each request takes {int} ms and whose response interceptor records what it sees',
  function (ms: number) {
    clientRecordingResponses(this, ms);
  },
);
