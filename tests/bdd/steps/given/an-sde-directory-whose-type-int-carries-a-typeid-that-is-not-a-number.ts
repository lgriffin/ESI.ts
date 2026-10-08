import { Given } from '../../support/steps';
import {
  UNSTORABLE_SDE_FILES,
  writeSdeDirectory,
} from '../../support/sdeFiles';

Given(
  'an SDE directory whose type {int} carries a typeID that is not a number',
  function (typeId: number) {
    if (typeId !== 34) throw new Error('UNSTORABLE_SDE_FILES spoils type 34');
    writeSdeDirectory(this, UNSTORABLE_SDE_FILES);
  },
);
