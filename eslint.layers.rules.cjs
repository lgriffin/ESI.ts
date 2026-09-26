/**
 * Layers: imports in src/ point inward only.
 *
 * - src/core/ports holds the ports: interfaces that import nothing outside
 *   their own directory.
 * - src/generated holds the generated operations: they import the ports and
 *   nothing else, so a regenerated file cannot reach into the pipeline.
 * - src/core is the pipeline. It must not import the layers built on top of
 *   it: the domain clients, the entry points, the generated operations, auth,
 *   the SDE, the testing helpers, or the new client and adapter trees.
 * - src/client and src/adapters (the builder tree and the port
 *   implementations) must not import the legacy domain clients or entry
 *   points they are replacing.
 *
 * Existing violations are listed in BASELINE and exempt from the core rule.
 * The list only shrinks: tests/tdd/layers/layers-lint.test.ts fails when an
 * entry no longer violates the rule, so fixing a file means deleting its
 * entry. Run with --no-inline-config (npm run lint:layers), so the baseline is
 * the only way round the rule.
 */

/** Files that break the core rule today, with the reason and when it goes. */
const BASELINE = {
  // Maps every client type to its class. Moves out of core in Phase 3.
  'src/core/ClientRegistry.ts': 'imports every domain client',
  // Takes EsiClientConfig as a type. The type moves into core in Phase 3.
  'src/core/configureApiClient.ts': 'imports the EsiClientConfig type',
};

/** What src/core may not import, as paths relative to src/. */
const ABOVE_CORE = [
  'clients',
  'EsiClient',
  'EsiClientBuilder',
  'index',
  'generated',
  'auth',
  'sde',
  'testing',
  'client',
  'adapters',
];

/** What src/client and src/adapters may not import, relative to src/. */
const LEGACY = ['clients', 'EsiClient', 'EsiClientBuilder', 'index'];

/** Deepest directory level under src/ the per-depth globs cover. */
const MAX_DEPTH = 6;

/** A regex source matching `../` repeated `depth` times. */
function up(depth) {
  return '\\.\\./'.repeat(depth);
}

/** A regex for an import of one of `names` (relative to src/) from `depth` levels below src/. */
function importOf(names, depth) {
  return `^${up(depth)}(?:${names.join('|')})(?:/.*|\\.js)?$`;
}

function restrict(patterns) {
  return { 'no-restricted-imports': ['error', { patterns }] };
}

/**
 * One config block per directory depth, because a relative import names a
 * layer by how far it climbs: `../clients` from src/core/x.ts and
 * `../../clients` from src/core/cache/x.ts are the same layer.
 */
function perDepth(root, names, message, ignores = []) {
  const rootDepth = root.split('/').length - 1;
  const blocks = [];
  for (let below = 0; below < MAX_DEPTH; below++) {
    const depth = rootDepth + below;
    blocks.push({
      files: [`${root}/${'*/'.repeat(below)}*.ts`],
      ignores,
      rules: restrict([{ regex: importOf(names, depth), message }]),
    });
  }
  return blocks;
}

const messages = {
  core:
    '[layers:core] src/core must not import a layer built on top of it. ' +
    'Depend on a port in src/core/ports instead. See guides/DESIGN-RULES.md#7--layers.',
  ports:
    '[layers:ports] A port imports nothing outside src/core/ports. ' +
    'See guides/DESIGN-RULES.md#7--layers.',
  generated:
    '[layers:generated] Generated operations import only the ports in src/core/ports. ' +
    'Change the generator, not the output. See guides/DESIGN-RULES.md#7--layers.',
  legacy:
    '[layers:legacy] The new client tree must not import the legacy domain clients or entry points. ' +
    'See guides/DESIGN-RULES.md#7--layers.',
};

/** The flat config, given the TypeScript parser. Later blocks win for the same file. */
function layersConfig(parser, { baseline = BASELINE } = {}) {
  return [
    {
      files: ['src/**/*.ts'],
      languageOptions: { parser },
    },
    ...perDepth('src/core', ABOVE_CORE, messages.core, Object.keys(baseline)),
    ...perDepth('src/client', LEGACY, messages.legacy),
    ...perDepth('src/adapters', LEGACY, messages.legacy),
    {
      files: ['src/core/ports/**/*.ts'],
      rules: restrict([{ regex: '^(?!\\./)', message: messages.ports }]),
    },
    {
      files: ['src/generated/**/*.ts'],
      rules: restrict([
        { regex: '^(?!\\.\\./core/ports/)', message: messages.generated },
      ]),
    },
  ];
}

module.exports = { BASELINE, layersConfig };
