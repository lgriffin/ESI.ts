/**
 * Unit tests for the BDD step API and its Jest binding.
 *
 * The specification's dry run and every converted feature depend on these
 * behaving exactly as cucumber-js would for the patterns the step API
 * accepts, so the matching rules, the Rule grouping, and the hook order are
 * pinned here with in-memory libraries rather than the real step files.
 */
import {
  planFeature,
  runScenario,
  unusedSteps,
} from '../../bdd/support/binder';
import {
  DataTable,
  StepLibrary,
  compileExpression,
} from '../../bdd/support/steps';

/** Build a library through the real registration API, isolated per test. */
function libraryOf(
  register: (api: typeof import('../../bdd/support/steps')) => void,
): StepLibrary {
  let library: StepLibrary | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const api =
      require('../../bdd/support/steps') as typeof import('../../bdd/support/steps');
    register(api);
    library = api.stepLibrary();
  });
  return library!;
}

describe('step patterns', () => {
  function argsFor(pattern: string, text: string): unknown[] | null {
    const lib = libraryOf(({ Given }) => Given(pattern, () => undefined));
    return lib.steps[0].match(text);
  }

  it('matches a plain string exactly and in full', () => {
    expect(argsFor('a valid region ID', 'a valid region ID')).toEqual([]);
    expect(argsFor('a valid region ID', 'a valid region ID 5')).toBeNull();
    expect(argsFor('a valid region ID', 'A valid region ID')).toBeNull();
  });

  it('treats regular expression characters in a string literally', () => {
    expect(argsFor('costs 5.5 ISK?', 'costs 5.5 ISK?')).toEqual([]);
    expect(argsFor('costs 5.5 ISK?', 'costs 5x5 ISK')).toBeNull();
  });

  it('converts {int} and {float} to numbers', () => {
    expect(
      argsFor('{int} orders at {float} ISK', '-3 orders at 4.5 ISK'),
    ).toEqual([-3, 4.5]);
  });

  it('accepts {string} in either quote style, without the quotes', () => {
    expect(argsFor('a status of {string}', 'a status of "online"')).toEqual([
      'online',
    ]);
    expect(argsFor('a status of {string}', "a status of 'offline'")).toEqual([
      'offline',
    ]);
  });

  it('matches {word} up to whitespace', () => {
    expect(argsFor('the {word} region', 'the Forge region')).toEqual(['Forge']);
    expect(argsFor('the {word} region', 'the The Forge region')).toBeNull();
  });

  it('passes regular expression groups through as strings', () => {
    const lib = libraryOf(({ Given }) =>
      Given(/^order (\d+)$/, () => undefined),
    );
    expect(lib.steps[0].match('order 42')).toEqual(['42']);
  });

  it.each([
    ['optional text', 'an order(s) exists'],
    ['alternation', 'a buy/sell order'],
    ['an unknown parameter type', 'a {region}'],
    ['an unclosed parameter', 'a {int'],
  ])('rejects %s, which cucumber-js would read differently', (_, pattern) => {
    expect(() => compileExpression(pattern)).toThrow(pattern);
  });

  it('records the keyword and registration order', () => {
    const lib = libraryOf(({ Given, When, Then }) => {
      Given('a', () => undefined);
      When('b', () => undefined);
      Then('c', () => undefined);
    });
    expect(lib.steps.map((s) => [s.keyword, s.index])).toEqual([
      ['Given', 0],
      ['When', 1],
      ['Then', 2],
    ]);
  });
});

describe('DataTable', () => {
  const table = new DataTable([
    ['status', 'retried'],
    ['500', 'yes'],
    ['400', 'no'],
  ]);

  it('exposes raw cells, body rows and header-keyed hashes', () => {
    expect(table.raw()).toEqual([
      ['status', 'retried'],
      ['500', 'yes'],
      ['400', 'no'],
    ]);
    expect(table.rows()).toEqual([
      ['500', 'yes'],
      ['400', 'no'],
    ]);
    expect(table.hashes()).toEqual([
      { status: '500', retried: 'yes' },
      { status: '400', retried: 'no' },
    ]);
  });
});

const FEATURE = `Feature: Fixture
  Description.

  Background:
    Given a client

  Rule: When A happens, the fixture shall do A.
    Rationale mentioning a doc string:

    Scenario: First A case
      When A happens
      Then A is done

  Rule: When B happens, the fixture shall do B.

    Scenario: A doc string that looks like a Rule
      When B happens with
        """
        Rule: not a rule
        """
      Then B is done

    Scenario Outline: B with status <status>
      When B happens with status <status>
      Then B is done

      Examples:
        | status |
        | 500    |
        | 503    |

    Scenario: B with a table
      When B happens for
        | region | orders |
        | Forge  | 2      |
      Then B is done
`;

describe('planFeature', () => {
  const library = libraryOf(({ Given, When, Then }) => {
    Given('a client', () => undefined);
    When('A happens', () => undefined);
    Then('A is done', () => undefined);
    When('B happens with', () => undefined);
    When('B happens with status {int}', () => undefined);
    When('B happens for', () => undefined);
    Then('B is done', () => undefined);
    Then('nothing uses this', () => undefined);
  });
  const { steps } = library;
  const plan = planFeature('fixture.feature', FEATURE, library);

  it('groups scenarios under the Rule that contains them, in file order', () => {
    expect(plan.title).toBe('Fixture');
    expect(
      plan.rules.map((r) => [r.title, r.scenarios.map((s) => s.title)]),
    ).toEqual([
      ['When A happens, the fixture shall do A.', ['First A case']],
      [
        'When B happens, the fixture shall do B.',
        [
          'A doc string that looks like a Rule',
          'B with status 500',
          'B with status 503',
          'B with a table',
        ],
      ],
    ]);
  });

  it('prepends Background steps and substitutes outline examples', () => {
    const outline = plan.rules[1].scenarios[2];
    expect(outline.steps.map((s) => `${s.keyword} ${s.text}`)).toEqual([
      'Given a client',
      'When B happens with status 503',
      'Then B is done',
    ]);
    expect(outline.steps[1].args).toEqual([503]);
  });

  it('carries doc strings and data tables as step arguments', () => {
    expect(plan.rules[1].scenarios[0].steps[1].argument).toBe(
      'Rule: not a rule',
    );
    expect(plan.rules[1].scenarios[3].steps[1].argument).toEqual([
      { region: 'Forge', orders: '2' },
    ]);
  });

  it('reports no problems when every step matches once', () => {
    expect(plan.problems).toEqual([]);
  });

  it('reports a step that matches no definition, with its location', () => {
    const partial = planFeature('fixture.feature', FEATURE, {
      ...library,
      steps: steps.filter((s) => s.pattern !== 'A is done'),
    });
    expect(partial.problems).toEqual([
      'fixture.feature:12 Then "A is done" matches no step definition',
    ]);
  });

  it('reports a step that matches more than one definition', () => {
    const ambiguous = planFeature('fixture.feature', FEATURE, {
      ...library,
      steps: [
        ...steps,
        ...libraryOf(({ Then }) =>
          Then(/^A is .+$/, () => undefined),
        ).steps.map((s) => ({ ...s, index: steps.length })),
      ],
    });
    expect(ambiguous.problems).toEqual([
      expect.stringMatching(
        /^fixture\.feature:12 Then "A is done" matches 2 step definitions: /,
      ),
    ]);
    // Ambiguity is its own finding; the candidates are not also unused.
    expect(unusedSteps([ambiguous], library).map((s) => s.pattern)).toEqual([
      'nothing uses this',
    ]);
  });

  it('lists definitions no plan uses', () => {
    expect(unusedSteps([plan], library).map((s) => s.pattern)).toEqual([
      'nothing uses this',
    ]);
  });
});

describe('runScenario', () => {
  const SCENARIO = `Feature: Hooks
  Rule: When it runs, the fixture shall record the order.
    Scenario: Order
      Given one
      When two
      Then three
`;

  function run(options: { failAt?: string; afterFails?: boolean } = {}) {
    const calls: string[] = [];
    const worlds = new Set<unknown>();
    const record = (name: string) =>
      function (this: { values: Record<string, unknown> }) {
        worlds.add(this);
        expect(this.values).toEqual(name === 'one' ? {} : { seen: true });
        this.values.seen = true;
        calls.push(name);
        if (options.failAt === name) throw new Error(`${name} failed`);
      };
    const library = libraryOf(({ Given, When, Then, Before, After }) => {
      Before(() => void calls.push('before 1'));
      Before(() => void calls.push('before 2'));
      Given('one', record('one'));
      When('two', record('two'));
      Then('three', record('three'));
      After(() => {
        calls.push('after 1');
        if (options.afterFails) throw new Error('after 1 failed');
      });
      After(() => void calls.push('after 2'));
    });
    const [scenario] = planFeature('hooks.feature', SCENARIO, library).rules[0]
      .scenarios;
    return { calls, worlds, promise: runScenario(scenario, library) };
  }

  it('runs Before hooks in order, the steps, then After hooks in reverse, on one World', async () => {
    const { calls, worlds, promise } = run();
    await promise;
    expect(calls).toEqual([
      'before 1',
      'before 2',
      'one',
      'two',
      'three',
      'after 2',
      'after 1',
    ]);
    expect(worlds.size).toBe(1);
  });

  it('stops at a failing step, still runs After hooks, and names the step', async () => {
    const { calls, promise } = run({ failAt: 'two' });
    await expect(promise).rejects.toThrow(
      /Failing step \(line 5\): When two\s+two failed/,
    );
    expect(calls).toEqual([
      'before 1',
      'before 2',
      'one',
      'two',
      'after 2',
      'after 1',
    ]);
  });

  it('reports the step failure rather than a later After hook failure', async () => {
    const { promise } = run({ failAt: 'two', afterFails: true });
    await expect(promise).rejects.toThrow('two failed');
  });

  it('fails the scenario when only an After hook fails', async () => {
    const { promise } = run({ afterFails: true });
    await expect(promise).rejects.toThrow(
      /Failing After hook\s+after 1 failed/,
    );
  });

  it('gives each scenario a new World', async () => {
    const first = run();
    const second = run();
    await Promise.all([first.promise, second.promise]);
    expect([...first.worlds][0]).not.toBe([...second.worlds][0]);
  });
});
