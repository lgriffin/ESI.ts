import { Given } from '../../support/steps';
import { queueLatestBuildFeedText } from '../../support/sdeFiles';

Given('the latest-build feed holds only blank lines', function () {
  queueLatestBuildFeedText('\n  \n');
});
