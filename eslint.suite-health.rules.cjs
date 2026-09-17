/**
 * Suite-health rules for tests/ (Testing Runway tier N): npm run lint:suite-health.
 *
 * They catch the decay that turns a green suite into a decorative one: a
 * focused test that silently disables the rest, a skipped or todo test, a test
 * or step that asserts nothing, an assertion whose failure a catch block
 * swallows, and console output silenced and never restored. Shared with the
 * rules' own test in tests/tdd/suite-health/.
 */
const jestPlugin = require('eslint-plugin-jest');
const tseslint = require('typescript-eslint');

/**
 * What counts as an assertion. `expect*` also covers this repo's helpers
 * (`expectEsiError`, `expectSearchRequest`, ...) and tsd's `expectType`,
 * `expectAssignable`, `expectError`. `describeClientErrors` needs no entry: it
 * registers its own `it` blocks, and those are linted where it is defined, in
 * tests/tdd/helpers/clientErrorTests.ts.
 *
 * `assertNoProblems` and `assertThat` (tests/support/assertions.ts) are the
 * assertion in the tiers that check many endpoints in one test and report
 * every problem together; see the comment there for why `expect` does not
 * fit those. Both throw, so a test that calls one still fails on a problem.
 */
const ASSERT_FUNCTION_NAMES = [
  'expect',
  'expect*',
  'fc.assert',
  'assertNoProblems',
  'assertThat',
];

/**
 * In tests/bdd, calls whose callback must assert besides Jest's own `it`/`test`:
 * - `Then` registers a step in tests/bdd/steps/then/ (support/steps.ts);
 * - `then` is a Then step inside a legacy jest-cucumber `defineFeature` file.
 * A scenario is covered through its Then steps: spec files
 * (`bindFeature(__filename)`) register no callbacks of their own. The legacy
 * scenario callback (`test`, a parameter shadowing the global) is deliberately
 * not listed: expect-expect credits an assertion to the outermost enclosing
 * block only, so a scenario would absorb its first Then step's assertion.
 * Outside tests/bdd a `Then` is test data (tests/tdd/bdd-binder builds step
 * libraries from no-op steps), so the names apply there only.
 */
const BDD_TEST_BLOCK_FUNCTIONS = ['Then', 'then'];

function nodeName(node) {
  if (!node) return null;
  switch (node.type) {
    case 'Identifier':
      return node.name;
    case 'ThisExpression':
      return 'this';
    case 'MemberExpression': {
      const object = nodeName(node.object);
      const property =
        node.property.type === 'Identifier'
          ? node.property.name
          : node.property.type === 'Literal'
            ? String(node.property.value)
            : null;
      return object && property ? `${object}.${property}` : null;
    }
    case 'CallExpression':
      return nodeName(node.callee);
    case 'ChainExpression':
    case 'TSNonNullExpression':
    case 'AwaitExpression':
      return nodeName(node.expression ?? node.argument);
    default:
      return null;
  }
}

// Same matching as eslint-plugin-jest's expect-expect, so both agree on what
// an assertion is.
function isAssertionName(name) {
  return (
    name !== null &&
    ASSERT_FUNCTION_NAMES.some((pattern) =>
      new RegExp(
        `^${pattern
          .split('.')
          .map((part) =>
            part === '**' ? '[_a-z\\d\\.]*' : part.replace(/\*/g, '[a-z\\d]*'),
          )
          .join('\\.')}(\\.|$)`,
        'ui',
      ).test(name),
    )
  );
}

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/** Depth-first search of `root` for a node matching `predicate`. */
function find(root, predicate, visitorKeys, { intoFunctions = true } = {}) {
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (predicate(node)) return node;
    if (node !== root && !intoFunctions && FUNCTION_TYPES.has(node.type)) {
      continue;
    }
    for (const key of visitorKeys[node.type] ?? []) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) if (item && item.type) stack.push(item);
      } else if (child && child.type) {
        stack.push(child);
      }
    }
  }
  return null;
}

const isAssertionCall = (node) =>
  node.type === 'CallExpression' && isAssertionName(nodeName(node.callee));

/** The variable `name` resolves to from `node`, or null for an undeclared global. */
function resolve(context, node, name) {
  for (
    let scope = context.sourceCode.getScope(node);
    scope;
    scope = scope.upper
  ) {
    const variable = scope.set.get(name);
    if (variable && variable.defs.length > 0) return variable;
  }
  return null;
}

/**
 * `test.<member>(...)` where `test` is the scenario parameter of a jest-cucumber
 * `defineFeature(feature, (test) => ...)` callback. Returns the member, or null.
 */
function scenarioMember(context, node, members) {
  const callee = node.callee;
  if (
    callee.type !== 'MemberExpression' ||
    callee.object.type !== 'Identifier' ||
    callee.property.type !== 'Identifier' ||
    !members.includes(callee.property.name)
  ) {
    return null;
  }
  const variable = resolve(context, node, callee.object.name);
  const def = variable && variable.defs[0];
  const call = def && def.type === 'Parameter' ? def.node.parent : null;
  return call &&
    call.type === 'CallExpression' &&
    nodeName(call.callee) === 'defineFeature'
    ? callee.property.name
    : null;
}

const plugin = {
  meta: { name: 'suite-health' },
  rules: {
    'no-focused-scenario': {
      meta: {
        type: 'problem',
        messages: {
          focused:
            'test.only in a defineFeature file runs this scenario alone and silently skips the rest. Remove .only.',
        },
        schema: [],
      },
      create(context) {
        return {
          CallExpression(node) {
            if (scenarioMember(context, node, ['only'])) {
              context.report({ node, messageId: 'focused' });
            }
          },
        };
      },
    },
    'no-disabled-scenario': {
      meta: {
        type: 'problem',
        messages: {
          disabled:
            'test.{{member}} in a defineFeature file keeps a scenario from running while the suite stays green. Implement it or delete it.',
          todo: '{{name}}.todo is a test that does not run. Write the test or track the gap in a bead.',
        },
        schema: [],
      },
      create(context) {
        return {
          CallExpression(node) {
            const member = scenarioMember(context, node, ['skip', 'todo']);
            if (member) {
              context.report({ node, messageId: 'disabled', data: { member } });
              return;
            }
            // jest/no-disabled-tests covers .skip, xit and xdescribe, not .todo.
            const callee = node.callee;
            if (
              callee.type === 'MemberExpression' &&
              callee.object.type === 'Identifier' &&
              ['it', 'test'].includes(callee.object.name) &&
              callee.property.type === 'Identifier' &&
              callee.property.name === 'todo' &&
              !resolve(context, node, callee.object.name)
            ) {
              context.report({
                node,
                messageId: 'todo',
                data: { name: callee.object.name },
              });
            }
          },
        };
      },
    },
    'no-swallowed-assertion': {
      meta: {
        type: 'problem',
        messages: {
          swallowed:
            'This catch block swallows the failure of an assertion in its try block: it neither rethrows nor asserts. Use expect(...).rejects/toThrow, or rethrow.',
        },
        schema: [],
      },
      create(context) {
        const keys = context.sourceCode.visitorKeys;
        return {
          TryStatement(node) {
            if (!node.handler || !find(node.block, isAssertionCall, keys)) {
              return;
            }
            const handles =
              find(node.handler.body, isAssertionCall, keys) ||
              find(
                node.handler.body,
                (n) => n.type === 'ThrowStatement',
                keys,
                { intoFunctions: false },
              );
            if (!handles) {
              context.report({ node: node.handler, messageId: 'swallowed' });
            }
          },
        };
      },
    },
    'no-unrestored-console-mock': {
      meta: {
        type: 'problem',
        messages: {
          unrestored:
            'console.{{method}} is silenced and never restored in this file, so later output (including failures logged to the console) disappears. Keep the spy and call mockRestore(), or call jest.restoreAllMocks().',
        },
        schema: [],
      },
      create(context) {
        const silenced = [];
        const restored = new Set();
        const reassigned = new Map();
        let restoreAll = false;
        const text = (n) => context.sourceCode.getText(n);

        return {
          CallExpression(node) {
            const name = nodeName(node.callee);
            if (name === 'jest.restoreAllMocks') restoreAll = true;
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'mockRestore'
            ) {
              restored.add(text(node.callee.object));
            }
            // jest.spyOn(console, 'x').mockImplementation(...) / .mockReturnValue(...)
            const spy =
              node.callee.type === 'MemberExpression' && node.callee.object;
            if (
              spy &&
              ['mockImplementation', 'mockReturnValue'].includes(
                node.callee.property.name,
              ) &&
              spy.type === 'CallExpression' &&
              nodeName(spy.callee) === 'jest.spyOn' &&
              spy.arguments[0] &&
              spy.arguments[0].type === 'Identifier' &&
              spy.arguments[0].name === 'console'
            ) {
              const parent = node.parent;
              const binding =
                parent.type === 'VariableDeclarator'
                  ? parent.id
                  : parent.type === 'AssignmentExpression'
                    ? parent.left
                    : null;
              const method = spy.arguments[1];
              silenced.push({
                node,
                binding: binding ? text(binding) : null,
                method:
                  method && method.type === 'Literal' ? method.value : '*',
              });
            }
          },
          // console.x = jest.fn() — restored by a later console.x = original.
          AssignmentExpression(node) {
            const name = nodeName(node.left);
            if (!name || !/^console\.\w+$/.test(name)) return;
            const list = reassigned.get(name) ?? [];
            list.push(node);
            reassigned.set(name, list);
          },
          'Program:exit'() {
            if (restoreAll) return;
            for (const { node, binding, method } of silenced) {
              if (binding === null || !restored.has(binding)) {
                context.report({
                  node,
                  messageId: 'unrestored',
                  data: { method },
                });
              }
            }
            for (const [name, nodes] of reassigned) {
              const isMock = (n) =>
                n.right.type === 'CallExpression' &&
                nodeName(n.right.callee) === 'jest.fn';
              // Every assignment is a mock: nothing puts the original back.
              if (nodes.every(isMock)) {
                context.report({
                  node: nodes.find(isMock),
                  messageId: 'unrestored',
                  data: { method: name.slice('console.'.length) },
                });
              }
            }
          },
        };
      },
    },
  },
};

const rules = {
  'jest/no-focused-tests': 'error',
  'suite-health/no-focused-scenario': 'error',
  'jest/no-disabled-tests': 'error',
  'suite-health/no-disabled-scenario': 'error',
  'jest/expect-expect': [
    'error',
    { assertFunctionNames: ASSERT_FUNCTION_NAMES },
  ],
  'suite-health/no-swallowed-assertion': 'error',
  'suite-health/no-unrestored-console-mock': 'error',
};

/**
 * The flat config npm run lint:suite-health uses. It lives here rather than in
 * eslint.suite-health.config.mjs so the rules' Jest suite can load the same
 * globs and options: Jest cannot import an ES module config.
 */
const config = [
  {
    // Fixture trees are inputs to other checks' tests, and to this one's:
    // they break the rules on purpose.
    ignores: ['tests/**/fixtures/**', 'tests/**/step-fixtures/**'],
  },
  {
    files: ['tests/**/*.{ts,mts,cts}'],
    languageOptions: { parser: tseslint.parser },
    // Disable comments in tests/ serve other lint configs. This config turns
    // none of their rules on, so it does not judge whether they are used.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    plugins: {
      jest: jestPlugin,
      'suite-health': plugin,
      // Registered with no rules on, so those disable comments still name a
      // known rule.
      '@typescript-eslint': tseslint.plugin,
    },
    rules,
  },
  {
    files: ['tests/bdd/**/*.ts'],
    rules: {
      'jest/expect-expect': [
        'error',
        {
          assertFunctionNames: ASSERT_FUNCTION_NAMES,
          additionalTestBlockFunctions: BDD_TEST_BLOCK_FUNCTIONS,
        },
      ],
    },
  },
  {
    // The binder registers one Jest test per scenario; the assertions are the
    // Then steps it runs, which the tests/bdd block above checks one by one.
    files: ['tests/bdd/support/binder.ts'],
    rules: { 'jest/expect-expect': 'off' },
  },
];

module.exports = { config };
