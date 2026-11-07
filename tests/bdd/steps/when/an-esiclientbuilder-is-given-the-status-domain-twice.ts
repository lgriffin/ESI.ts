import { EsiClientBuilder } from '../../../../src/EsiClientBuilder';
import { When } from '../../support/steps';

When('an EsiClientBuilder is given the status domain twice', function () {
  const client = new EsiClientBuilder()
    .addClient('status')
    .addClient('status')
    .withConfig({ logLevel: 'error' })
    .build();
  this.cleanups.push(() => client.shutdown());
  this.result = client;
});
