import type { IncompletePagesMode } from '../../../../src/core/pagination/pageLimit';
import { pagingClient } from '../../support/paging';
import { Given } from '../../support/steps';

Given(
  'a client in incompletePages mode {string} with a recording logger',
  function (mode: string) {
    pagingClient(this, mode as IncompletePagesMode);
  },
);
