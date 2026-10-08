import { Then } from '../../support/steps';
import { openBuiltDatabase, writeAheadFileLeft } from '../../support/sdeFiles';

Then(
  'the database shall be in WAL journal mode with no write-ahead file beside it',
  function () {
    expect(writeAheadFileLeft(this)).toBe(false);
    expect(openBuiltDatabase(this).journalMode).toBe('wal');
  },
);
