import { startRequest } from '../../support/pipeline-parts';
import { Given } from '../../support/steps';

Given('a request for {string} is in flight', function (key: string) {
  void startRequest(this, key);
});
