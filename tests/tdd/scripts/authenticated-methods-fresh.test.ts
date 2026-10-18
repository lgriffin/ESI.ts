/**
 * src/clients/authenticatedMethods.generated.ts is written by
 * `npm run generate:public-clients` (scripts/spec/generate-public-clients.ts)
 * and read by `PublicClient`, the type `buildPublic()` returns. A domain
 * client that gains a method needing a token, without a regeneration, would
 * leave that method callable on a public client's type.
 *
 * tests/tdd/clients/publicClient.test.ts compares the method lists it parses
 * out of the committed file. This regenerates the file the way the script
 * does, the core's classification rendered and formatted by Prettier, and
 * compares it byte for byte, the check `-- --check` makes. It runs the
 * clients over a stub transport, so it needs no network.
 */
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import * as path from 'path';

import {
  AUTHENTICATED_METHODS_PATH,
  classifyMethods,
  renderAuthenticatedMethods,
} from '../../../scripts/spec/authenticated-methods-core';

const ROOT = path.resolve(__dirname, '../../..');

/**
 * Formats `source` as the generator does. The generated file's own name is
 * in .prettierignore, which would make Prettier echo the input, so this
 * names a sibling: same directory, same configuration.
 */
function format(source: string): string {
  return execFileSync(
    process.execPath,
    [
      require.resolve('prettier/bin/prettier.cjs'),
      '--stdin-filepath',
      path.join(ROOT, 'src/clients/authenticatedMethods.fresh.ts'),
    ],
    { input: source, encoding: 'utf8' },
  );
}

describe('authenticatedMethods.generated.ts is fresh', () => {
  it('matches what generate:public-clients writes today', async () => {
    const { authenticated, unknown } = await classifyMethods();
    expect(unknown).toEqual([]);

    const regenerated = format(renderAuthenticatedMethods(authenticated));
    const committed = readFileSync(
      path.join(ROOT, AUTHENTICATED_METHODS_PATH),
      'utf8',
    );

    expect(committed).toBe(regenerated);
  }, 60_000);
});
