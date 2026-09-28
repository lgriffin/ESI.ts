import { When } from '../../support/steps';
import { openMemoryProviderFromFreshSdeEntry } from '../../support/sdeFiles';

When(
  'a MemorySdeProvider holding Tritanium is built from a fresh load of the SDE entry point',
  function () {
    openMemoryProviderFromFreshSdeEntry(this);
  },
);
