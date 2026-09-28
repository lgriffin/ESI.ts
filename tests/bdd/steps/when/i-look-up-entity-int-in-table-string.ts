import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When(
  'I look up entity {int} in table {string}',
  function (id: number, table: string) {
    this.result = sdeProvider(this).getEntity(table, id);
  },
);
