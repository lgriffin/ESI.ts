// Imports in src/ point inward only: npm run lint:layers. The rule, and the
// baseline of files that break it today, live in eslint.layers.rules.cjs.
import tseslint from 'typescript-eslint';
import layers from './eslint.layers.rules.cjs';
import loggerImports from './eslint.logger-imports.rules.cjs';

// The logger-import block rides along so --no-inline-config holds it too:
// no eslint-disable comment gets a pipeline file round it (#265).
export default [
  ...layers.layersConfig(tseslint.parser),
  ...loggerImports.loggerImportsConfig(),
];
