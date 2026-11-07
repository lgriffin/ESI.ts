import { ids } from '../../support/pipeline-parts';
import type { EsiClient } from '../../../../src/EsiClient';
import { When } from '../../support/steps';

When('the client posts {int} IDs', async function (count: number) {
  const chunks: number[] = [];
  this.values.chunks = chunks;
  const poster = (chunk: number[]): Promise<number[]> => {
    chunks.push(chunk.length);
    return Promise.resolve(chunk);
  };
  this.result = await (this.client as EsiClient).batchPost(ids(count), poster);
});
