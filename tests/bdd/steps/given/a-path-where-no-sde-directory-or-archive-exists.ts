import { Given } from '../../support/steps';
import { absentSdePaths } from '../../support/sdeFiles';

Given('a path where no SDE directory or archive exists', function () {
  absentSdePaths(this);
});
