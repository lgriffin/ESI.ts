/**
 * Probe for known issue esi-v2s.16: the `./sde` entry loads js-yaml and
 * adm-zip, which the package does not declare as dependencies. The runner
 * calls this before it installs them into the consumer.
 *
 * Exit 0: `./sde` loads under both `require` and `import` (the issue is fixed).
 * Exit 3: it fails only because js-yaml or adm-zip is missing (still reproduces).
 * Exit 1: it fails for any other reason.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SPECIFIER = '@lgriffin/esi.ts/sde';
const MISSING = /Cannot find (module|package) '(js-yaml|adm-zip)'/;

const failures = [];
try {
  require(SPECIFIER);
} catch (err) {
  failures.push(err);
}
try {
  await import(SPECIFIER);
} catch (err) {
  failures.push(err);
}

if (failures.length === 0) process.exit(0);
const messages = failures.map((err) =>
  err instanceof Error ? err.message : String(err),
);
if (messages.every((m) => MISSING.test(m))) {
  console.log(messages.map((m) => m.split('\n')[0]).join('\n'));
  process.exit(3);
}
console.error(messages.join('\n'));
process.exit(1);
