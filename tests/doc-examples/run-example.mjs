/**
 * node run-example.mjs <emitted example>.mjs
 *
 * Installs the stub fetch, then imports the example, so its top-level awaits
 * run to completion. Exits 0 only when the example settles without throwing
 * and every request it made had a stub route.
 * The explicit exit stops an example that forgot `shutdown()` from holding
 * the process open on a timer.
 */
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { installStubFetch, requests, unrouted } from './stub-fetch.mjs';

const target = process.argv[2];
if (!target) {
  console.error('usage: node run-example.mjs <example.mjs>');
  process.exit(2);
}

installStubFetch();
try {
  await import(pathToFileURL(resolve(target)).href);
  if (unrouted.length > 0) {
    throw new Error(
      `requests with no stub route (add them to stub-fetch.mjs): ${unrouted.join(', ')}`,
    );
  }
  process.exit(0);
} catch (err) {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  if (requests.length > 0) console.error(`requests: ${requests.join(', ')}`);
  process.exit(1);
}
