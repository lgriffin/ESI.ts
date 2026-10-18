/**
 * npm run generate:public-clients [-- --check]
 *
 * Writes src/clients/authenticatedMethods.generated.ts: per custom domain
 * client, the public methods that need a token. See
 * scripts/spec/authenticated-methods-core.ts.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';

import {
  AUTHENTICATED_METHODS_PATH,
  classifyMethods,
  renderAuthenticatedMethods,
} from './authenticated-methods-core';

async function main(): Promise<void> {
  const out = path.resolve(__dirname, '../..', AUTHENTICATED_METHODS_PATH);
  const { authenticated, unknown } = await classifyMethods();
  if (unknown.length > 0) {
    console.error(
      `Could not tell whether these need a token:\n  ${unknown.join('\n  ')}`,
    );
    process.exit(2);
  }
  const config = (await prettier.resolveConfig(out)) ?? {};
  const source = await prettier.format(renderAuthenticatedMethods(authenticated), {
    ...config,
    filepath: out,
  });
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
    if (current !== source) {
      console.error(
        `${AUTHENTICATED_METHODS_PATH} is stale. Run \`npm run generate:public-clients\` and commit the result.`,
      );
      process.exit(1);
    }
    console.log(`${AUTHENTICATED_METHODS_PATH} is up to date.`);
    return;
  }
  fs.writeFileSync(out, source);
  const count = Object.values(authenticated).reduce((n, m) => n + m.length, 0);
  console.log(`wrote ${AUTHENTICATED_METHODS_PATH}: ${count} methods`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
