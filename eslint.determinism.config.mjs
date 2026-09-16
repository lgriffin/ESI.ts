// Time and randomness in src/ go through the clock module. The ratchet over
// existing sites is npm run lint:determinism (scripts/determinism-lint.ts);
// this config lists every site with its location:
//   npx eslint --config eslint.determinism.config.mjs --no-inline-config src
import tseslint from 'typescript-eslint';
import determinism from './eslint.determinism.rules.cjs';

export default determinism.determinismConfig(tseslint.parser);
