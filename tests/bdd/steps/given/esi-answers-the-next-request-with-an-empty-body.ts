import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI answers the next request with an empty body', function () {
  queueResponse({
    headers: { 'content-type': 'application/json', 'content-length': '0' },
    body: '',
  });
});
