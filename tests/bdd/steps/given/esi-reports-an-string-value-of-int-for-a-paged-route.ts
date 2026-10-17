import { queueReportedPageCount } from '../../support/security-boundary';
import { Given } from '../../support/steps';

Given(
  'ESI reports an {string} value of {int} for a paged route',
  function (header: string, reported: number) {
    queueReportedPageCount(this, header, reported);
  },
);
