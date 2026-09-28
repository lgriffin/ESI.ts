import { When } from '../../support/steps';
import { readArchiveMetadata } from '../../support/sdeFiles';

When('I read the archive metadata', function () {
  readArchiveMetadata(this);
});
