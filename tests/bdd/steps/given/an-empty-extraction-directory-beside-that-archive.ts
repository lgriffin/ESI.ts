import { emptyExtractionDirectory } from '../../support/security-boundary';
import { Given } from '../../support/steps';

Given('an empty extraction directory beside that archive', function () {
  emptyExtractionDirectory(this);
});
