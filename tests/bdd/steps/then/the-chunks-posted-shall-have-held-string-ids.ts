import { Then } from '../../support/steps';

Then(
  'the chunks posted shall have held {string} IDs',
  function (sizes: string) {
    const chunks = this.values.chunks as number[];
    expect(chunks.length === 0 ? 'none' : chunks.join(', ')).toBe(sizes);
  },
);
