import { EsiClientBuilder } from '../../../../src/EsiClientBuilder';
import { recordingLogger } from '../../support/logging';
import { When } from '../../support/steps';

When('an EsiClientBuilder is given the status domain twice', function () {
  const logger = recordingLogger();
  this.values.constructionLogger = logger;
  const client = new EsiClientBuilder()
    .addClient('status')
    .addClient('status')
    .withConfig({ logger })
    .build();
  this.cleanups.push(() => client.shutdown());
  this.result = client;
});
