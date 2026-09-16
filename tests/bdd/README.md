# BDD Specification

This directory is the executable specification for ESI.ts. It is written with
**EARS** (Easy Approach to Requirements Syntax) for the requirements and
**Gherkin** for the scenarios that verify them, and it is enforced by
`npm run spec:audit`.

This file states the rules. [`GUIDE.md`](GUIDE.md) is the long-form
walkthrough: choosing a pattern, deriving a requirement from the assertions,
fixing each audit finding, and converting a scenario that predates the
convention.

## Why

A requirement written as free prose is ambiguous and drifts from the code.
EARS fixes the ambiguity by constraining requirements to a small set of
sentence templates, each stating exactly one testable behaviour. Gherkin fixes
the drift by making the scenarios underneath each requirement execute against
the real client.

The result is one artifact serving three purposes: documentation of what the
library does, the acceptance criteria for "done", and the regression suite.

## Layout

```text
tests/bdd/
  features/
    core/         NNNN-domain.feature   — one file per domain client, plus cross-cutting concerns
    integration/  multi-client workflows
    performance/  throughput and latency characteristics
    sde/          static data export provider
  specs/
    core/…/NNNN-domain.spec.ts   — binds the feature at the same path under features/
    step-library.spec.ts         — the dry run (rule 8)
  steps/
    given|when|then/             — one step per file, named after its pattern (rule 7)
  step-definitions/              — legacy: one defineFeature file per feature, being split up
    core|integration|performance|sde/   *.steps.ts
    shared/                             client setup, error and perf helpers
  support/
    steps.ts      — Given/When/Then, Before/After, DataTable
    world.ts      — per-scenario state, `this` in every step
    binder.ts     — runs a feature against the step library under Jest
    hooks.ts      — installs the transport seam around every scenario
    transport.ts  — the HTTP transport seam every scenario mocks at (rule 5)
    <domain>.ts   — a converted domain's fixtures, IDs and paths
```

Every `.feature` file is run by exactly one of two things, and the audit fails
a feature with neither or both:

- a **spec entry**, `specs/<area>/NNNN-domain.spec.ts`, whose whole content is
  `bindFeature(__filename)`. Its steps come from the global library in
  `steps/`. Converted domains: corporation projects, killmails, mail, market,
  universe, wallet, wars.
- a **legacy step file**, `step-definitions/<area>/<domain>.steps.ts`, bound
  with `loadFeature(<path>)` / `defineFeature`, with every step inline. These
  are listed in `scripts/spec-audit-exceptions.json` under `legacyStepFiles`,
  and the list only shrinks.

## The runner

The suite runs on Jest. Feature files are parsed by jest-cucumber, and
`support/binder.ts` binds them to the step library. Step files are written
against `support/steps.ts`, which has the same shape as `@cucumber/cucumber`:
`Given`/`When`/`Then` with `this` as the World, `Before`/`After`, and string
patterns that are Cucumber Expressions. Moving to cucumber-js later would
change the import in each step file and nothing else.

This was decided in Phase 2 of the ramp-up epic (`esi-v2s.3`). The plan had
recommended cucumber-js, for two things jest-cucumber's `defineFeature` lacks:
Rule titles in test output, and a dry run that finds missing and unused steps.
The binder provides both on Jest. Staying keeps three things a move would have
cost:

- **Node support.** `@cucumber/cucumber` 13 requires Node 22 or later. The
  package supports Node 18 and CI runs the suite on 18, 20 and 22.
- **Mutation testing.** The BDD-only Stryker run (`npm run mutation:bdd`) and its
  per-directory ratchet use the Jest runner's per-test coverage analysis.
- **Coverage.** Scenarios count towards the Jest coverage thresholds, with no
  second coverage tool to merge.

The cost is that jest-cucumber has not had a release since July 2024. Only its
parser is used now, and only by `binder.ts`, so replacing it touches one file.
Rules are recovered from the source text, because its parser flattens them.

## The rules the audit enforces

Every rule in this section has a check in the `scripts/spec-audit*.ts` pair and a
fixture in `tests/tdd/spec-audit/fixtures/`. If it is listed here, CI fails when
it is broken.

### 1. One EARS requirement per `Rule:` block — the title _is_ the requirement

```gherkin
Rule: If a response omits the ETag header, then the ETag cache shall store no entry for that request.
  Without an ETag there is nothing to revalidate against later, so caching the
  body would risk serving data the client has no way to check.

  Scenario: Response without an ETag header is not cached
    Given a server response without ETag headers
    When the client makes requests without ETag
    Then the client shall work normally without caching
```

- Exactly one `shall` per Rule title. Two behaviours means two Rules.
- `shall` only. Not `should`, `may`, `will`, or `must`.
- Name the system (`the ETag cache`, `the EsiClient`, `the SDE provider`) —
  never `it shall`.
- No vague or unmeasurable language: `efficiently`, `gracefully`, `robust`,
  `as appropriate`, `various`, `in a timely manner`. If a reader cannot tell
  whether the system met the requirement, it is not a requirement.
- The prose under the title carries the **why** — rationale, boundaries, links
  to ADRs or ESI spec behaviour. It must not contain another `shall`; a
  requirement hidden in prose is one no scenario is traceable to.

### 2. Every Scenario lives under the Rule it verifies

No scenarios at feature level. If a scenario does not verify a stated
requirement, either the requirement is missing or the scenario is.

A feature with no `Rule:` block at all states no requirement, so it fails too —
as does a feature with no description, since the description is where a reader
learns what the file covers.

### 3. The five EARS patterns

| Pattern            | Template                                                     |
| :----------------- | :----------------------------------------------------------- |
| Ubiquitous         | `The <system> shall <response>.`                             |
| Event-driven       | `When <trigger>, the <system> shall <response>.`             |
| State-driven       | `While <state>, the <system> shall <response>.`              |
| Optional feature   | `Where <feature is enabled>, the <system> shall <response>.` |
| Unwanted behaviour | `If <condition>, then the <system> shall <response>.`        |

`When` is instantaneous; `While` lasts for a duration. If you can ask "how long
does it last?", use `While`. The `If` form is the only one that takes `then`:
the condition must be non-empty, followed by a comma, then `then`, and `then`
must come before `shall`. `When`, `While` and `Where` take a comma after their
clause, before the system name.

## Review conventions the audit does not check

These are caught in review, with two exceptions: rule 5 has its own lint gate,
and step-file structure (rules 7 and 8) is checked by the audit and the dry run.

### 4. Scenario names describe the case, not the requirement

The Rule title already states the requirement — a scenario that restates it
adds nothing. Name the specific case being exercised.

```gherkin
# BAD  — restates the rule, and encodes EARS keywords in the title
Scenario: WHEN the cache is manually cleared, the client shall remove all cached data

# GOOD — names the case
Scenario: Clearing the cache removes every stored entry
```

In a legacy step file, scenario names must match the `test('...')` string
exactly, or jest-cucumber will not bind them. A spec entry needs no names: the
binder takes them from the feature.

### 5. Mock at the transport seam, not the method under test

This is the one that decides whether the suite is worth running, and it is
**enforced**: `npm run lint:bdd-seam` fails on any `spyOn` of an ESI client, a
domain client, a client prototype or `ApiClient`, and on reassigning a client
method, anywhere under `tests/bdd/`. The selectors live in
`eslint.bdd-seam.rules.cjs`; `tests/tdd/bdd-seam/` proves each one fires.

```ts
// BAD — mocks the method the scenario exists to exercise. The Then step
// asserts on TestDataFactory's output, so the scenario cannot fail for any
// bug in MarketApi.
jest.spyOn(client.market, 'getMarketPrices').mockResolvedValue(expected);

// GOOD — describes the HTTP exchange. Path building, auth headers, the rate
// limiter, retry, the ETag cache, deduplication, JSON parsing and Zod
// validation all really execute.
Given('the market system is operational', function () {
  queueResponse({
    match: marketPaths.prices,
    body: marketFixtures.priceList(),
  });
});
When('the client requests current market prices', async function () {
  this.result = await this.client.market.getMarketPrices();
});
```

In a spec-bound feature, `support/hooks.ts` installs the seam around every
scenario and `this.client` is a seam client. A legacy step file calls
`useHttpTransport()` at the top of `defineFeature` and `createSeamClient()` in
`beforeEach`.

`tests/bdd/support/transport.ts` is the seam:

| Helper                                                            | Purpose                                                                              |
| :---------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| `useHttpTransport()`                                              | Legacy step files: installs the fake transport for every scenario in the feature     |
| `createSeamClient(config?)`                                       | A real `EsiClient` with a test bearer token, no request spacing, millisecond backoff |
| `queueResponse({ status, headers, body, match, times, delayMs })` | Queues what ESI sends back; `match` pins it to a URL fragment or pattern             |
| `queueError(status, message, options?)`                           | Queues ESI's `{ "error": message }` body                                             |
| `RETRYABLE_ATTEMPTS`                                              | How many requests a retryable 5xx consumes before the client gives up                |
| `sentRequests()` / `lastRequest()`                                | What the client actually put on the wire: method, parsed `URL`, headers, body        |

The transport is strict. A request with no queued response fails the scenario,
and so does a queued response nobody requested — either means the scenario's
picture of the exchange is wrong (a cache hit where it expected a fetch, a
retry it did not budget for). Assert on the request as well as the result when
the Rule is about what is sent: the path, query parameters, method or body.

`resilience.steps.ts` additionally drives real `CircuitBreaker` and
`RetryStrategy` objects for Rules about those components in isolation.

### 6. Step bodies delegate to the support layer

No raw URL strings, fixture construction, or response assembly inline in a
step. Put it in `support/<domain>.ts` (converted domains) or
`step-definitions/shared/` and call it.

### 7. One step per file, named after the step

A step file under `steps/` registers exactly one step, sits in the directory
of its keyword, and is named after its pattern:

```ts
// tests/bdd/steps/when/the-client-requests-market-history.ts
import { THE_FORGE, TRITANIUM } from '../../support/market';
import { When } from '../../support/steps';

When('the client requests market history', async function () {
  this.result = await this.client.market.getMarketHistory(THE_FORGE, TRITANIUM);
});
```

Steps are global: the step text in any feature finds the file by name, and a
second feature using the same words reuses it. `this` is a new `World` per
scenario. Use `function`, not an arrow function, or `this` is lost. What one
step leaves for a later one goes on `this.result`, `this.error` or
`this.values`.

String patterns are Cucumber Expressions, limited to `{int}`, `{float}`,
`{string}` and `{word}`. Optional text `(s)` and alternation `a/b` are
rejected when the step loads, not matched literally, so a pattern means the
same under cucumber-js. For anything else, use a regular expression literal.

Converting a legacy domain: move each step into its own file (reword a step
whose text collides with another feature's), move fixtures and paths into
`support/<domain>.ts`, add the spec entry, delete the legacy file and remove it
from `legacyStepFiles`.

### 8. Every step matches exactly one definition, and every definition is used

`npm run bdd:steps` is the dry run. It resolves every step of every
spec-bound feature against the library without running a scenario, and fails
on a step with no definition, a step with several, and a definition no feature
uses. A spec entry also refuses to run a feature with a missing or ambiguous
step, so these fail `npm test` too.

## Workflow for a behaviour change

1. Write or update the EARS requirement as a `Rule:` title in the right
   feature file. Prefer adding a Rule to an existing file over creating one.
2. Write the scenario(s) under it.
3. Run them and **confirm they fail**. A scenario that passes before the code
   changes is testing nothing.
4. Implement.
5. Run and confirm green.
6. Run `npm run spec:audit`.

## The audit

```bash
npm run spec:audit             # all feature files
npm run spec:audit:verbose     # plus requirement and scenario counts
npx ts-node scripts/spec-audit.ts tests/bdd/features/core/0023-market.feature
```

It parses the real Gherkin AST, runs in CI, and emits inline annotations on the
offending lines. It checks exactly this, and nothing else. First, the feature
files:

| Check                                                            | Fixture                                                                    |
| :--------------------------------------------------------------- | :------------------------------------------------------------------------- |
| Rule title contains exactly one `shall`                          | `rule-without-shall`, `rule-with-two-shalls`                               |
| Rule title uses no `should` / `may` / `will` / `must`            | `rule-wrong-obligation`                                                    |
| Rule title contains no vague, unmeasurable or escape-clause term | `rule-vague-language`                                                      |
| Rule title names the system rather than a pronoun                | `rule-pronoun-before-shall`                                                |
| `If` titles read `If <condition>, then … shall …`                | `rule-if-without-then`, `rule-if-without-comma`, `rule-if-empty-condition` |
| `When` / `While` / `Where` titles put a comma after the clause   | `rule-when-without-comma`                                                  |
| Rule description states no further requirement                   | `rule-requirement-in-description`                                          |
| Every Rule has at least one Scenario                             | `rule-without-scenarios`                                                   |
| Every Scenario sits under a Rule                                 | `scenario-outside-rule`                                                    |
| Every Feature has at least one Rule                              | `feature-without-rules`                                                    |
| Every Feature has a description                                  | `feature-without-description`                                              |

Then, on a full run (no paths given), the step files. These checks live in
`scripts/spec-audit-steps.ts` and read step files with the TypeScript parser,
without running them. Each fixture is a small repository tree under
`tests/tdd/spec-audit/step-fixtures/`:

| Check                                                                                                  | Fixture                                            |
| :----------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| A step file sits directly in `steps/given`, `steps/when` or `steps/then`                               | `step-file-location`                               |
| A step file registers exactly one step                                                                 | `step-file-count`                                  |
| The step's keyword matches its directory                                                               | `step-file-keyword`                                |
| The pattern is a string or regular expression literal                                                  | `step-file-pattern`                                |
| The file is named after the pattern                                                                    | `step-file-name`                                   |
| No two string patterns differ only in literal numbers or quoted strings                                | `step-near-duplicate`                              |
| Every feature is run by a spec entry or a legacy step file, and not both                               | `feature-unbound`, `feature-bound-twice`           |
| Every spec entry names an existing feature                                                             | `spec-without-feature`                             |
| Every legacy step file is listed in `legacyStepFiles`; the list gains no entry, and every entry exists | `legacy-step-file-unlisted`, `-added`, `-dangling` |

Matching steps to definitions is not in this list. It needs the patterns
compiled exactly as the runner compiles them, so it is the dry run's job
(rule 8).

`tests/tdd/spec-audit/spec-audit.test.ts` runs the fixtures through the audit,
so a check that stops firing fails the unit suite rather than passing quietly.
`spec-audit-steps.test.ts` does the same for the step-file checks, and
`tests/tdd/bdd-binder/` pins the binder's matching, Rule grouping and hook
order.
It drives the CLI in a child process, because `@cucumber/gherkin` is ESM-only
and Jest cannot load it: the checks that need no Gherkin AST live in
`scripts/spec-audit-checks.ts`, free of that dependency, and are imported
directly.

The audit itself runs as CommonJS under ts-node, so it loads the ESM-only
Cucumber packages through a real dynamic `import()` rather than `require()`.
That keeps it working on every Node the package supports (18 and above), not
only on those with `require(esm)` (20.19+ / 22.12+). The unit matrix runs the
fixture suite on Node 18, 20 and 22, so a regression there fails CI.

`scripts/spec-audit-exceptions.json` lists feature files not yet converted to
Rule form. It is a **ratchet in both directions**, and the run fails when:

- an entry is present that is not in the committed baseline on the integration
  branch — a PR cannot exempt its own feature file;
- a listed file now passes the audit — the improvement has to be locked in;
- a listed path does not name an existing `.feature` file — stale entries make
  the remaining work look larger than it is.

The baseline is read with `git show <ref>:scripts/spec-audit-exceptions.json`,
trying `$SPEC_AUDIT_BASE_REF`, then `origin/master`, then `master`. If no ref
resolves the baseline is empty, so every entry reads as an addition; the
ratchet fails closed. The list is empty today — new feature files are
Rule-compliant from the start.

`legacyStepFiles` in the same file ratchets the same way, against the same
baseline. It is not empty, so a full audit needs the integration branch
fetched; the CI job fetches `master` before it runs. The one exception is a
baseline whose file has no `legacyStepFiles` key at all, which only happens on
the change that introduces the key: additions cannot be detected there, and the
check is skipped.

## The consistency check

A well-formed Rule can still promise something the library does not
guarantee. `npm run validate:spec-consistency` (`scripts/rule-schema-check.ts`,
part of `check:all`) holds Rule titles to the Zod schemas the pipeline
validates responses against:

| Check                                                                                                                             | Fixture                                                  |
| :-------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| A Rule naming a response field the schema marks optional qualifies it (`when present`, `if present`, `optional`, `either … or …`) | `inconsistent/…/0007-clones`, `consistent/…/0007-clones` |

How a feature finds its schemas: `features/core/NNNN-<domain>.feature` below
0050 maps to `src/core/endpoints/<domain>Endpoints.ts`, or the singular form
(`0031-skills` → `skillEndpoints.ts`). Every object reachable from any
`responseSchema` in that file is a candidate. A field counts as named when the
response part of the title (after `shall`) spells its identifier
(`home_location`) or its prose form (`home location`, `station identifier`).
To stay quiet on ambiguous titles, each mention is resolved to the endpoints
the trigger names (`When a planet is requested` → `getPlanetById`), then to
the objects declaring the most of the title's fields, and is reported only when
optional in all of them. A domain feature with no endpoint file fails the run.
Fixtures and matcher cases live in `tests/tdd/rule-schema-check/`.

`scripts/rule-schema-exceptions.json` lists `warnOnly` files, whose findings
print as warnings. It ratchets like the audit's list: an entry absent from the
integration branch, an entry whose file has no findings left, and an entry that
names no feature file all fail the run.

The same standard applies to the pipeline, which the check cannot read: a Rule
must not contradict the cross-cutting Rules in `0050-etag-caching.feature` and
`0051-resilience.feature`. A domain failure Rule that says a 5xx rejects holds
only when every attempt fails and no usable cached entry exists, and says so.
