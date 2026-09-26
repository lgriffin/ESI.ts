/**
 * Layers: imports in src/ point inward only.
 *
 * - src/core/ports holds the ports: interfaces that import nothing outside
 *   src/core/ports, packages included.
 * - src/generated holds the generated operations: they import the ports and
 *   nothing else, so a regenerated file cannot reach into the pipeline.
 * - src/core is the pipeline. It must not import the layers built on top of
 *   it: the domain clients, the entry points, the generated operations, auth,
 *   the SDE, the testing helpers, or the new client and adapter trees.
 * - src/client and src/adapters (the builder tree and the port
 *   implementations) must not import the legacy domain clients or entry
 *   points they are replacing.
 *
 * The rule resolves every module specifier against the importing file, so a
 * redundant segment (`.././clients`) or a detour (`./../ApiClient`) is judged
 * by where it lands, at any directory depth. It reads static imports,
 * re-exports, `import x = require()`, `import('...')` types and expressions,
 * and `require()` calls.
 *
 * Existing violations are listed in BASELINE and exempt from the core rule.
 * The list only shrinks: tests/tdd/layers/layers-lint.test.ts fails when an
 * entry no longer violates the rule, so fixing a file means deleting its
 * entry. Run with --no-inline-config (npm run lint:layers), so the baseline is
 * the only way round the rule.
 */
const path = require('node:path');

/** Files that break the core rule today, with the reason and when it goes. */
const BASELINE = {
  // Maps every client type to its class. Moves out of core in Phase 3.
  'src/core/ClientRegistry.ts': 'imports every domain client',
  // Takes EsiClientConfig as a type. The type moves into core in Phase 3.
  'src/core/configureApiClient.ts': 'imports the EsiClientConfig type',
};

/** Top-level entries of src/ that src/core may not import. */
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

/** Top-level entries of src/ that src/client and src/adapters may not import. */
const LEGACY = ['clients', 'EsiClient', 'EsiClientBuilder', 'index'];

const PORTS = 'src/core/ports';

const messages = {
  core:
    '[layers:core] src/core must not import {{target}}, a layer built on top of it. ' +
    'Depend on a port in src/core/ports instead. See guides/DESIGN-RULES.md#7--layers.',
  ports:
    '[layers:ports] A port imports nothing outside src/core/ports, and {{target}} is outside it. ' +
    'See guides/DESIGN-RULES.md#7--layers.',
  generated:
    '[layers:generated] Generated operations import only the ports in src/core/ports, not {{target}}. ' +
    'Change the generator, not the output. See guides/DESIGN-RULES.md#7--layers.',
  legacy:
    '[layers:legacy] The new client tree must not import {{target}}, a legacy client or entry point. ' +
    'See guides/DESIGN-RULES.md#7--layers.',
};

const within = (file, dir) => file === dir || file.startsWith(`${dir}/`);

/** The first path segment under src/, without a file extension. */
function topOfSrc(target) {
  if (!within(target, 'src')) return null;
  const [top] = target.slice('src/'.length).split('/');
  return top.replace(/\.(?:[cm]?[jt]s|d\.ts)$/, '');
}

/**
 * The violation, if any, for an import of `specifier` from `importer`
 * (a repo-relative posix path), as `{ messageId, target }`.
 */
function check(importer, specifier, baseline) {
  const relative = specifier.startsWith('.');
  const target = relative
    ? path.posix.normalize(
        path.posix.join(path.posix.dirname(importer), specifier),
      )
    : specifier;
  const shown = relative ? target : `the package ${specifier}`;

  if (within(importer, PORTS)) {
    return relative && within(target, PORTS)
      ? null
      : { messageId: 'ports', target: shown };
  }
  if (within(importer, 'src/generated')) {
    return relative && within(target, PORTS)
      ? null
      : { messageId: 'generated', target: shown };
  }
  if (!relative) return null;
  const top = topOfSrc(target);
  if (within(importer, 'src/core') && !baseline.includes(importer)) {
    return ABOVE_CORE.includes(top) ? { messageId: 'core', target } : null;
  }
  if (within(importer, 'src/client') || within(importer, 'src/adapters')) {
    return LEGACY.includes(top) ? { messageId: 'legacy', target } : null;
  }
  return null;
}

/** The string literal a module-specifier node holds, or null. */
function literal(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node;
  if (node.type === 'TSLiteralType') return literal(node.literal);
  return null;
}

const inwardImports = {
  meta: {
    type: 'problem',
    docs: { description: 'Imports in src/ point inward only.' },
    schema: [
      {
        type: 'object',
        properties: { baseline: { type: 'array', items: { type: 'string' } } },
        additionalProperties: false,
      },
    ],
    messages,
  },
  create(context) {
    const importer = path
      .relative(context.cwd, context.filename)
      .split(path.sep)
      .join('/');
    const baseline = context.options[0]?.baseline ?? [];

    function report(specifierNode) {
      const source = literal(specifierNode);
      if (!source) return;
      const violation = check(importer, source.value, baseline);
      if (violation) {
        context.report({
          node: source,
          messageId: violation.messageId,
          data: { target: violation.target },
        });
      }
    }

    return {
      ImportDeclaration: (node) => report(node.source),
      ExportNamedDeclaration: (node) => report(node.source),
      ExportAllDeclaration: (node) => report(node.source),
      ImportExpression: (node) => report(node.source),
      // import('x').T: `argument` before typescript-eslint 9, `source` after.
      TSImportType: (node) => report(node.source ?? node.argument),
      TSExternalModuleReference: (node) => report(node.expression),
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'require')
          report(node.arguments[0]);
      },
    };
  },
};

/** The flat config, given the TypeScript parser. */
function layersConfig(parser, { baseline = BASELINE } = {}) {
  return [
    {
      files: ['src/**/*.ts'],
      languageOptions: { parser },
      plugins: { layers: { rules: { 'inward-imports': inwardImports } } },
      rules: {
        'layers/inward-imports': ['error', { baseline: Object.keys(baseline) }],
      },
    },
  ];
}

module.exports = { BASELINE, layersConfig };
