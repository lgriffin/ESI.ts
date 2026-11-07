import { cursorClient } from '../../support/paging';
import { Given } from '../../support/steps';

Given('a cursor pagination client', function () {
  this.values.cursorClient = cursorClient();
});
