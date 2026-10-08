import { Given } from '../../support/steps';
import { manyTypes, writeSdeDirectory } from '../../support/sdeFiles';

Given(
  'an SDE directory whose types file holds {int} types',
  function (count: number) {
    writeSdeDirectory(this, manyTypes(count));
  },
);
