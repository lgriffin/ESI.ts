/**
 * Determinism: src/ reads time and randomness only through the clock module.
 *
 * A test can only assert Expires handling, retry backoff or circuit half-open
 * timing if the code under test takes its time from something the test
 * controls. Wall-clock reads, real timers and Math.random() anywhere else make
 * those assertions flaky or impossible, so they are restricted everywhere in
 * src/ except CLOCK_MODULES. Existing sites are counted in
 * scripts/determinism-baseline.json, which only shrinks
 * (npm run lint:determinism).
 *
 * Every restricted construct has an id. The id is tagged into the lint message
 * as `[determinism:<id>]`; the baseline counts sites per file and id, and each
 * id has a negative fixture in tests/tdd/determinism-lint/fixtures/violations/.
 */

/** Where injected time lives. Allow-listed; nothing else in src/ is. */
const CLOCK_MODULES = ['src/core/clock.ts'];

const FILES = ['src/**/*.ts'];

const TIMER_GLOBALS = {
  'set-timeout': 'setTimeout',
  'set-interval': 'setInterval',
  'set-immediate': 'setImmediate',
  'queue-microtask': 'queueMicrotask',
};

/** Objects through which a timer global can be reached as a property. */
const GLOBAL_OBJECTS = ['globalThis', 'global', 'window', 'self'];

const NODE_TIMER_MODULES = [
  'timers',
  'timers/promises',
  'node:timers',
  'node:timers/promises',
];

const why = {
  'date-now': 'reads the wall clock',
  'new-date': 'reads the wall clock',
  'date-call': 'reads the wall clock',
  'performance-now': 'reads a monotonic clock',
  'process-hrtime': 'reads a monotonic clock',
  'math-random':
    'is unseeded randomness (backoff jitter belongs with the clock)',
  'set-timeout': 'schedules on real time',
  'set-interval': 'schedules on real time',
  'set-immediate': 'runs outside the control of the caller',
  'queue-microtask': 'runs outside the control of the caller',
  'node-timers': 'imports real timers',
};

/** The ids of every restricted construct, in a stable order. */
const CONSTRUCTS = Object.keys(why);

function message(id) {
  return (
    `[determinism:${id}] This ${why[id]}. Take time from the clock module ` +
    `(${CLOCK_MODULES.join(', ')}) so tests can control it. Existing sites ` +
    'are baselined in scripts/determinism-baseline.json, which only shrinks.'
  );
}

const TAG = /\[determinism:([a-z-]+)\]/;

/** The construct id a lint message was raised for, or null for any other message. */
function constructOf(lintMessage) {
  const match = TAG.exec(lintMessage.message ?? '');
  return match && CONSTRUCTS.includes(match[1]) ? match[1] : null;
}

const rules = {
  'no-restricted-properties': [
    'error',
    { object: 'Date', property: 'now', message: message('date-now') },
    {
      object: 'performance',
      property: 'now',
      message: message('performance-now'),
    },
    {
      object: 'process',
      property: 'hrtime',
      message: message('process-hrtime'),
    },
    { object: 'Math', property: 'random', message: message('math-random') },
    ...Object.entries(TIMER_GLOBALS).flatMap(([id, name]) =>
      GLOBAL_OBJECTS.map((object) => ({
        object,
        property: name,
        message: message(id),
      })),
    ),
  ],
  'no-restricted-globals': [
    'error',
    ...Object.entries(TIMER_GLOBALS).map(([id, name]) => ({
      name,
      message: message(id),
    })),
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: "NewExpression[callee.name='Date'][arguments.length=0]",
      message: message('new-date'),
    },
    {
      selector: "CallExpression[callee.name='Date']",
      message: message('date-call'),
    },
  ],
  'no-restricted-imports': [
    'error',
    {
      paths: NODE_TIMER_MODULES.map((name) => ({
        name,
        message: message('node-timers'),
      })),
    },
  ],
};

/**
 * The flat config for this check. The clock module keeps the rules switched
 * off rather than ignored, so it is still parsed and still counted as linted.
 */
function determinismConfig(parser) {
  return [
    {
      files: FILES,
      languageOptions: { parser },
      rules,
    },
    {
      files: CLOCK_MODULES,
      rules: Object.fromEntries(
        Object.keys(rules).map((rule) => [rule, 'off']),
      ),
    },
  ];
}

module.exports = {
  CLOCK_MODULES,
  CONSTRUCTS,
  constructOf,
  determinismConfig,
  rules,
};
