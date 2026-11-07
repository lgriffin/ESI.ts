import { ApiClientBuilder } from '../../../../src/core/ApiClientBuilder';
import { When } from '../../support/steps';

When(
  'an ApiClientBuilder builds a client for {string}',
  function (link: string) {
    this.values.apiClient = new ApiClientBuilder()
      .setClientId('bdd-parts')
      .setLink(link)
      .build();
  },
);
