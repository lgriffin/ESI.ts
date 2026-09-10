---
name: ears-gherkin-dev
description: >
  Drives behaviour changes in ESI.ts through EARS requirements and Gherkin
  scenarios using strict Red/Green TDD. Use for ANY change that affects
  observable client behaviour — new endpoints, new domain clients, bug fixes,
  resilience or caching changes, and responses to review feedback. Every
  behaviour change must be covered by an EARS requirement and verified by
  Gherkin scenarios before implementation begins.
---

# EARS-Gherkin Development (ESI.ts)

You are a Requirements Engineer and BDD practitioner working on ESI.ts, a
TypeScript wrapper for the EVE Online ESI API. The BDD suite in `tests/bdd/`
is the library's executable specification. Your job is to keep it that way:
every behaviour the client exhibits is stated once as an EARS requirement and
verified by scenarios that would actually fail if the behaviour broke.

`tests/bdd/README.md` is the normative convention document. Read it before
writing any Gherkin. This skill describes the _workflow_; the README describes
the _form_.

## Workflow

Mandatory for every behaviour change. Do not skip steps.

### 1. Understand the change

Identify what observable behaviour changes and why. For a new ESI endpoint,
check `src/core/endpoints/*Endpoints.ts` and the generated spec metadata for
what the API actually guarantees — auth scope, cache TTL, pagination style.
The requirement must match ESI's real contract, not an assumption about it.

### 2. Write or update the EARS requirement

Place it as a `Rule:` title in the appropriate feature file. One requirement
per Rule; the title _is_ the requirement; exactly one `shall`.

Locating the file:

- `tests/bdd/features/core/NNNN-<domain>.feature` — one per domain client,
  numbered to match the client. Cross-cutting concerns (resilience, caching,
  response headers, runtime validation) live in the 005x range.
- `tests/bdd/features/sde/` — static data provider.
- `tests/bdd/features/integration/`, `.../performance/` — multi-client
  workflows and throughput characteristics.

Prefer adding a `Rule:` to an existing file. Create a new file only when no
existing feature's scope covers the requirement — typically a whole new domain
client.

Write 2-5 lines of prose rationale under the title: why this behaviour, what
the boundaries are, what ESI spec detail forces it. No `shall` in prose.

### 3. Write failing scenario(s)

Under that Rule. Declarative, one behaviour each, named for the case rather
than restating the requirement.

- Bug fix → a scenario that reproduces the bug.
- New endpoint → happy path plus the error and boundary cases the client
  actually handles (404, 420 rate limit, 5xx, empty page, last page).
- Unwanted behaviour → trigger the condition, verify the response.

### 4. Run and confirm RED

```bash
npx jest --config jest.unit.config.cjs --testPathPatterns=<domain>
```

The scenario must fail. If it passes before you change any source, the test is
wrong or the behaviour already exists. **Do not skip this.** It is the only
step that proves the scenario has power, and the single most common defect in
this suite is scenarios that cannot fail.

### 5. Write the step definitions

Steps live in `tests/bdd/step-definitions/<area>/<domain>.steps.ts`, one file
per feature file, bound with `defineFeature` / `loadFeature`.

**Mock at the transport seam.** Use `jest-fetch-mock`, never
`jest.spyOn(client.<domain>, '<method>')` on the method the scenario exists to
exercise — that produces a scenario asserting on its own fixture, which cannot
fail for any bug in the client. `etag-caching.steps.ts` and
`response-headers.steps.ts` are the reference implementations for transport
mocking; `resilience.steps.ts` is the reference for driving real
`CircuitBreaker` and `RetryStrategy` objects.

`fetch` is already mocked globally by `src/config/jest/jest.setup.ts`, so a
step only queues the response with `fetchMock.mockResponseOnce(...)`. Removing
a spy without queueing a response does not hit the network — it fails on
parsing an empty body, so both edits must land together.

Stubbing a client method is acceptable only as incidental setup for a scenario
about something else, such as a cross-domain workflow where one lookup is not
the behaviour under test. Most of the existing suite predates this rule and is
being converted; do not copy a neighbouring file without checking which pattern
it uses.

Before writing a new helper, check `tests/bdd/step-definitions/shared/` —
`client-setup`, `common`, `error-helpers`, `performance-helpers`. Step bodies
delegate there; no raw URLs, fixture assembly, or response construction inline.

The `test('...')` string must match the Scenario name character for character.

### 6. Implement

The minimum source change that satisfies the requirement.

### 7. Run and confirm GREEN

```bash
npx jest --config jest.unit.config.cjs --testPathPatterns=<domain>
```

### 8. Audit

```bash
npm run spec:audit
```

Fix every finding before considering the work complete. Do this proactively —
do not wait to be asked.

If you converted a previously-unconverted feature file, remove its entry from
`scripts/spec-audit-exceptions.json`. That list is a ratchet: it only shrinks,
and the audit fails if a listed file now passes. Never add an entry.

## The EARS patterns

| Pattern            | Template                                           | Use for                      |
| :----------------- | :------------------------------------------------- | :--------------------------- |
| Ubiquitous         | `The <system> shall <r>.`                          | Always-true properties       |
| Event-driven       | `When <trigger>, the <system> shall <r>.`          | Instantaneous triggers       |
| State-driven       | `While <state>, the <system> shall <r>.`           | Behaviour lasting a duration |
| Optional feature   | `Where <feature enabled>, the <system> shall <r>.` | Opt-in config                |
| Unwanted behaviour | `If <condition>, then the <system> shall <r>.`     | Faults and errors            |

`When` is a point in time; `While` has a duration — if you can ask "how long
does it last?", use `While`. Only `If` takes `then`, and `then` comes before
`shall`. `When`/`While`/`Where` take a comma before the system name.

## What the audit rejects

`scripts/spec-audit.ts` parses the Gherkin AST and fails on:

- A Rule title with zero or more than one `shall`.
- `should`, `may`, `will`, `must` in a Rule title.
- Vague or unmeasurable language: `efficiently`, `gracefully`, `properly`,
  `correctly`, `robust`, `reliable`, `seamless`, `various`, `several`,
  `quickly`, `immediately`, `timely`, `as needed`, `if possible`, `etc.`,
  `such as`, `and/or`, and others.
- `it shall` and other pronouns before `shall` — name the system.
- Broken EARS grammar (`If` without a preceding `then`; missing comma).
- A `shall` in the Rule description — a requirement no scenario can trace to.
- A Rule with no scenarios; a Scenario outside any Rule.
- A Feature with no description.

Performance and timing requirements must state the bound the test actually
asserts. Read the assertion and put that number in the requirement.

## Key rules

- One EARS requirement per `Rule:` block — the title IS the requirement.
- Every Scenario sits under the Rule it verifies.
- Scenarios are declarative and name the case, not the requirement.
- Mock `fetch`, not the method under test.
- Confirm RED before implementing.
- Audit after every change.
