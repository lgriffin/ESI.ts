import { keys, newProbe, probeFetcher } from '../../support/pipeline-parts';
import type { EsiClient } from '../../../../src/EsiClient';
import { When } from '../../support/steps';

When(
  'the client fetches a batch of {int} keys',
  async function (count: number) {
    const probe = newProbe();
    this.values.probe = probe;
    this.result = await (this.client as EsiClient).batch(
      keys(count),
      probeFetcher(probe, this.values.failures as Map<string, unknown>),
    );
  },
);
