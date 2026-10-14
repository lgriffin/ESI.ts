import { Given } from '../../support/steps';
import { emptyExtractionTarget } from '../../support/sdeFiles';

Given('an empty extraction directory', function () {
  emptyExtractionTarget(this);
});
