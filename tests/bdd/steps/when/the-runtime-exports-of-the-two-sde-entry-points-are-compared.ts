import { When } from '../../support/steps';
import { compareEntryPoints } from '../../support/sdeFiles';

When(
  'the runtime exports of the two SDE entry points are compared',
  function () {
    this.result = compareEntryPoints();
  },
);
