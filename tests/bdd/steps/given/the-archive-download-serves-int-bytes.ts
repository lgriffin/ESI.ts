import { Given } from '../../support/steps';
import { queueArchiveDownload } from '../../support/sdeFiles';

Given('the archive download serves {int} bytes', function (bytes: number) {
  queueArchiveDownload(this, bytes);
});
