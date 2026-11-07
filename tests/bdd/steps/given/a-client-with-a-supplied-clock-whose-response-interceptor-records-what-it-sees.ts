import { clientRecordingResponses } from '../../support/pipeline-edges';
import { Given } from '../../support/steps';

Given(
  'a client with a supplied clock whose response interceptor records what it sees',
  function () {
    clientRecordingResponses(this);
  },
);
