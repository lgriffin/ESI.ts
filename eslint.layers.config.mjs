// Imports in src/ point inward only: npm run lint:layers. The rule, and the
// baseline of files that break it today, live in eslint.layers.rules.cjs.
import tseslint from 'typescript-eslint';
import layers from './eslint.layers.rules.cjs';

export default layers.layersConfig(tseslint.parser);
