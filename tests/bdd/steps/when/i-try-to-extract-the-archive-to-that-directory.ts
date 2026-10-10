import { tryExtractHostileArchive } from '../../support/security-boundary';
import { When } from '../../support/steps';

When('I try to extract the archive to that directory', function () {
  tryExtractHostileArchive(this);
});
