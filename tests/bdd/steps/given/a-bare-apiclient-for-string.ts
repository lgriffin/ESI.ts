import { ApiClient } from '../../../../src/core/ApiClient';
import { Given } from '../../support/steps';

Given('a bare ApiClient for {string}', function (link: string) {
  this.values.apiClient = new ApiClient('bdd-parts', link);
});
