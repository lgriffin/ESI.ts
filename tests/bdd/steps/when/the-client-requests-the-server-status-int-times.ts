import { settle } from '../../support/pipeline-edges';
import { When } from '../../support/steps';

When(
  'the client requests the server status {int} times',
  async function (times: number) {
    const outcomes = [];
    for (let i = 0; i < times; i++) {
      outcomes.push(await settle(() => this.client.status.getStatus()));
    }
    this.values.outcomes = outcomes;
  },
);
