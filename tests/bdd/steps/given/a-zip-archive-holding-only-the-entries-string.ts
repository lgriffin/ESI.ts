import { Given } from '../../support/steps';
import { zipEntries } from '../../support/sdeFiles';

Given(
  'a ZIP archive holding only the entries {string}',
  function (names: string) {
    zipEntries(
      this,
      names.split(',').map((name) => name.trim()),
    );
  },
);
