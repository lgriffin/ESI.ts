import { sentRequests } from '../../support/transport';
import { STATUS_PATH } from '../../support/request-headers';
import { Then } from '../../support/steps';

Then(
  'ESI shall have received {int} requests for the server status',
  function (count: number) {
    const requests = sentRequests().filter((r) =>
      STATUS_PATH.test(r.url.pathname),
    );
    expect(requests).toHaveLength(count);
  },
);
