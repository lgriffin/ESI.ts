import { When } from '../../support/steps';
import { buildDatabase } from '../../support/sdeFiles';

When('I build a SQLite database from the archive', function () {
  buildDatabase(this);
});
