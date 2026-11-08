import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI answers the next request with one empty page', function () {
  queueResponse({ headers: { 'x-pages': '1' }, body: [] });
});
