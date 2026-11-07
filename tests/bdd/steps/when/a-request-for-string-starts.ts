import { startRequest } from '../../support/pipeline-parts';
import { When } from '../../support/steps';

When('a request for {string} starts', function (key: string) {
  void startRequest(this, key);
});
