import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('ESI accepts the mail as mail {int}', function (mailId: number) {
  queueResponse({ status: 201, match: '/mail/', body: mailId });
});
