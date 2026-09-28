import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up every entity in table {string}', function (table: string) {
  this.result = sdeProvider(this).getAllEntities(table);
});
