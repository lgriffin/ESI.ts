import type { IncompletePagesMode } from '../../../../src/core/pagination/pageLimit';
import { useIncompletePagesMode } from '../../support/security-boundary';
import { Given } from '../../support/steps';

Given(
  'a client whose incompletePages option is {string}',
  function (mode: string) {
    useIncompletePagesMode(this, mode as IncompletePagesMode);
  },
);
