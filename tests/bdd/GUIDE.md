# Writing EARS Requirements: A Practical Guide

`README.md` in this directory states the rules. This guide is how to actually
follow them: choosing a pattern, deriving a requirement from real code, fixing
each audit finding, and converting a scenario that predates the convention.

If you only read one thing, read [The one rule that matters](#the-one-rule-that-matters).

## Contents

- [Who this is for](#who-this-is-for)
- [The 60-second version](#the-60-second-version)
- [Anatomy of a feature file](#anatomy-of-a-feature-file)
- [Choosing an EARS pattern](#choosing-an-ears-pattern)
- [The one rule that matters](#the-one-rule-that-matters)
- [Writing the rationale](#writing-the-rationale)
- [One Rule or several?](#one-rule-or-several)
- [Naming scenarios](#naming-scenarios)
- [Wiring the step definitions](#wiring-the-step-definitions)
- [Fixing audit findings](#fixing-audit-findings)
- [Walkthrough: adding a new endpoint](#walkthrough-adding-a-new-endpoint)
- [Anti-patterns](#anti-patterns)
- [Known limitations](#known-limitations)

## Who this is for

Anyone adding or changing observable behaviour in ESI.ts. Every such change
needs an EARS requirement and a scenario, and `npm run spec:audit` runs in CI
as a required check, so this is not optional polish.

Agents should also read `.claude/skills/ears-gherkin-dev/SKILL.md`, which
covers the Red/Green workflow this guide assumes.

## The 60-second version

**EARS** (Easy Approach to Requirements Syntax) constrains requirements to five
sentence templates. Each states exactly one testable behaviour, so two readers
cannot disagree about whether the system met it.

In Gherkin, one EARS requirement goes in one `Rule:` title, and the scenarios
that verify it nest underneath:

```gherkin
Rule: If a character fleet lookup is answered with HTTP 404, then the Fleet client shall reject with an EsiError.
  ESI reports "not currently in a fleet" as a 404 rather than as an empty
  body, so the not-in-a-fleet case surfaces as a typed rejection.

  Scenario: Character who is not in any fleet
    Given a character that is not in a fleet
    When the client requests fleet info for the character not in a fleet
    Then the client shall return a 404 error
```

The Rule title **is** the requirement. Not a heading for it, not a summary of
it — the sentence itself, ending in a full stop, with exactly one `shall`.

## Anatomy of a feature file

```gherkin
Feature: ETag Caching
  The EsiClient can cache GET responses that carry an ETag header, keyed by
  endpoint. Each entry has a TTL derived from the endpoint's cache metadata
  in the ESI spec, so a repeat request inside that window is answered from
  memory with no HTTP call at all.
  ↑ Feature description: required. What this file covers and why. Two or
    three sentences. This is the only prose a reader gets before the rules.

  # ── Storing responses ───────────────────────────────────────────────
  ↑ Optional section divider. Use them once a file passes ~6 rules.

  Rule: When a response carrying an ETag header is received, the ETag cache shall store the response body against the requested endpoint.
    The ETag is the server's own identity for a representation, so its
    presence is what marks a response as re-usable.
    ↑ Rationale prose: the *why*. Never contains `shall` — a requirement
      hidden here is one no scenario can be traced to, and the audit rejects it.

    Scenario: First response carrying an ETag is stored in the cache
      Given a fresh client with no cached data
      When the client makes an API request that returns an ETag
      Then the response shall be cached for future use
```

Feature files live in:

| Path                                  | Contents                                                |
| :------------------------------------ | :------------------------------------------------------ |
| `features/core/NNNN-<domain>.feature` | One per domain client, numbered to match                |
| `features/core/005x-*.feature`        | Cross-cutting: resilience, caching, headers, validation |
| `features/sde/`                       | Static data provider                                    |
| `features/integration/`               | Multi-client workflows                                  |
| `features/performance/`               | Throughput and latency                                  |

Each `.feature` maps to exactly one `*.steps.ts` under `step-definitions/`.
Prefer adding a `Rule:` to an existing file; create a new file only for a whole
new domain client.

## Choosing an EARS pattern

| Pattern            | Template                                                     | Use when                         |
| :----------------- | :----------------------------------------------------------- | :------------------------------- |
| Ubiquitous         | `The <system> shall <response>.`                             | Always true, no trigger          |
| Event-driven       | `When <trigger>, the <system> shall <response>.`             | A discrete thing happens         |
| State-driven       | `While <state>, the <system> shall <response>.`              | A condition holds for a duration |
| Optional feature   | `Where <feature is enabled>, the <system> shall <response>.` | Behaviour depends on config      |
| Unwanted behaviour | `If <condition>, then the <system> shall <response>.`        | Faults, errors, edge cases       |

A decision procedure, in order:

1. **Is this about something going wrong?** — a non-2xx status, a timeout, a
   malformed payload, a missing field. Use `If … then …`.
2. **Does it only apply when a client option is set?** Use `Where`. In ESI.ts
   that means `enableETagCache`, `validateResponse`, and similar constructor
   flags.
3. **Is there a condition that lasts?** Use `While`. The test: can you ask
   _"how long does it last?"_ and get a sensible answer? "While a cached entry
   is within its TTL" — yes, it lasts until the TTL expires. "While the circuit
   breaker is open" — yes.
4. **Is there a discrete trigger?** Use `When`. `When` is a point in time: a
   request is made, a response arrives, a method is called.
5. **Otherwise** it is Ubiquitous. Use these sparingly — an unconditional
   requirement is usually a sign the condition has been left implicit.

The current distribution across the 327 requirements, for calibration:

| Pattern            | Count |
| :----------------- | ----: |
| `When`             |   228 |
| `If`               |    71 |
| `The` (ubiquitous) |    16 |
| `While`            |     8 |
| `Where`            |     4 |

`When` dominating is expected for a client wrapper — most requirements describe
what a call returns. If you are writing a `While` or a `Where`, check the
handful that already exist first; they are the patterns people get wrong.

### `When` vs `While`

The most common mix-up. Both read naturally in English; only one is right.

```gherkin
# WRONG — "the cache is warm" is a state, not an event
Rule: When the cache is warm, the ETag cache shall serve the stored body.

# RIGHT
Rule: While a cached entry is within its spec-aware TTL, the ETag cache shall serve the stored body without issuing an HTTP request.
```

### `If` vs `When`

`When` is for the normal path. `If` is for what you would rather did not
happen. A 404 from ESI is expected traffic, but it is still an unwanted
condition from the caller's point of view, so it takes `If`.

Only `If` uses `then`, and `then` must come **before** `shall`. The other three
prefixes take a comma before the system name. The audit enforces both.

## The one rule that matters

**Write the requirement from the assertions, not from the old title or from
what you assume the code does.** Open the step definition, read what the `Then`
step actually checks, and state that.

Converting this suite turned up a long list of scenarios whose titles promised
things the assertions never checked. Real examples:

| Title claimed                                        | Assertion actually does              | Requirement now says                  |
| :--------------------------------------------------- | :----------------------------------- | :------------------------------------ |
| "shall transition to half-open"                      | `expect(getState()).toBe('closed')`  | Closes after a successful probe       |
| "WHILE not in a fleet, shall return an empty result" | Expects an `EsiError` from a 404     | Rejects with an `EsiError` on 404     |
| "shall handle large data sets efficiently"           | 8000 elements resolve in `< 1000 ms` | States the 1000 ms bound              |
| "analyzing price trends … identify market patterns"  | The _step_ diffs the averages itself | History records return in ESI's order |
| "shall minimize API calls"                           | Counts no calls at all               | States the 300 ms fan-out bound only  |

A requirement that overstates coverage is worse than no requirement: it tells
the next reader a behaviour is protected when nothing protects it.

If the honest requirement is narrower than you want the library to promise,
that is a real coverage gap. Write the narrow requirement, then file an issue
for the missing scenario. Do not write the aspirational one.

### Corollary: put the real number in

Performance and timing requirements must state the bound the test asserts. Read
the assertion, take the **tightest** bound if there are several, and put that
number in the Rule. `< 1000 ms` and a derived `> 10 ops/sec` on the same
scenario means the effective bound is whichever is tighter — say that one.

## Writing the rationale

Two to five lines under the title. It carries everything the one-sentence
requirement cannot:

- **Why** the behaviour is this way — usually something about ESI's real
  contract rather than a choice we made.
- **Boundaries** — what the requirement deliberately does not cover.
- **Pointers** — ESI spec quirks, ADRs, related endpoints.

```gherkin
Rule: If a response omits the ETag header, then the ETag cache shall store no entry for that request.
  Without an ETag there is nothing to revalidate against later, so caching
  the body would risk serving data the client has no way to check. These
  responses pass straight through to the caller.
```

No `shall` in the prose — the audit rejects it. If you find yourself wanting a
second `shall`, you have found a second requirement; give it its own Rule.

## One Rule or several?

Group scenarios under a shared Rule when they verify _the same requirement from
different angles_. Split them when they verify _different requirements_.

Grouping is right here — three scenarios, one behaviour:

```gherkin
Rule: While a cached entry is within its spec-aware TTL, the ETag cache shall serve the stored body without issuing an HTTP request.

  Scenario: Repeat request inside the TTL window is served from the cache
  Scenario: Repeat request inside the TTL window does not observe changed server data
  Scenario: Repeat request inside the TTL window does not observe a server error
```

All three assert the same thing — no request leaves the client — under
different server conditions.

A useful heuristic: **if fixing one broken scenario would necessarily fix the
others, they belong under one Rule.**

Error scenarios group well. Three scenarios asserting `instanceof EsiError` for
a 404, a network failure, and a rate limit are one requirement, not three:

```gherkin
Rule: If an alliance request fails, then the Alliance client shall reject with an EsiError.
```

Conversely, a client that fans out over unrelated endpoints needs a Rule per
endpoint, because the payloads share no requirement. `0036-universe.feature`
has 14 Rules for 15 scenarios for exactly this reason. That is fine.

## Naming scenarios

The Rule states the requirement; the scenario names the **case**. A scenario
that restates its Rule adds nothing.

```gherkin
# BAD — restates the rule, and encodes EARS keywords in a scenario title
Scenario: WHEN the cache is manually cleared, the client shall remove all cached data

# GOOD — names the case
Scenario: Clearing the cache removes every stored entry
```

Scenario names must match the `test('...')` string in the `.steps.ts` file
**character for character**, or jest-cucumber will not bind them and the suite
will fail with a missing-scenario error. Rename both together.

Shortening a name often changes Prettier's line wrapping in the steps file, so
run `npx prettier --write` on it afterwards — `format:check` is a CI gate.

## Wiring the step definitions

Full detail is in `README.md` §5; the essentials:

**Mock at the transport seam.** Use `jest-fetch-mock`, not
`jest.spyOn(client.<domain>, '<method>')` on the method the scenario exists to
exercise. Stubbing that method means the `Then` step asserts on the fixture the
`Given` step just supplied — the scenario cannot fail for any bug in
`ApiRequestHandler`, retry, rate limiting, or schema validation.

```ts
// BAD — cannot fail for any bug in MarketApi
jest.spyOn(client.market, 'getMarketPrices').mockResolvedValue(expected);

// GOOD — the whole pipeline really executes
fetchMock.mockResponseOnce(JSON.stringify(expected), {
  headers: { ETag: '"abc"' },
});
```

**The gotcha:** `fetch` is _already_ mocked globally for every BDD file by
`src/config/jest/jest.setup.ts`, which calls `fetchMock.enableMocks()` and
resets in a global `beforeEach`. So deleting a spy does **not** cause a real
network call — it causes the client to parse an empty body and fail
confusingly. Removing the spy and queueing the response must land in the same
edit.

Reference implementations: `etag-caching.steps.ts` and
`response-headers.steps.ts` for transport mocking; `resilience.steps.ts` for
driving real `CircuitBreaker` and `RetryStrategy` objects.

Most of the existing suite predates this rule and is still being converted, so
**do not copy a neighbouring file without checking which pattern it uses.**

## Fixing audit findings

```bash
npm run spec:audit                                    # all files
npm run spec:audit:verbose                            # plus counts
npx ts-node scripts/spec-audit.ts <path/to.feature>   # one file
```

In CI the findings also appear as inline annotations on the offending lines.

| Finding                                       | What it means                                  | Fix                                                               |
| :-------------------------------------------- | :--------------------------------------------- | :---------------------------------------------------------------- |
| `must contain 'shall'`                        | The Rule title is a heading, not a requirement | Rewrite as a full EARS sentence                                   |
| `contains N occurrences of 'shall'`           | Two requirements in one title                  | Split into two Rules                                              |
| `non-standard obligation keyword`             | `should` / `may` / `will` / `must`             | Use `shall`. If it genuinely is optional, it is not a requirement |
| `contains vague language`                     | Unmeasurable term — see below                  | Replace with the value the test asserts                           |
| `Pronoun 'it' found before 'shall'`           | The system is referenced, not named            | Name it: `the ETag cache`, `the Fleet client`                     |
| `'If' pattern requires 'then' before 'shall'` | EARS grammar                                   | `If <condition>, then the <system> shall …`                       |
| `clause should be followed by a comma`        | EARS grammar                                   | `When <trigger>, the <system> shall …`                            |
| `Description contains N EARS requirement(s)`  | A `shall` in the rationale prose               | Move it to its own Rule title                                     |
| `No scenarios found under this rule`          | Requirement with nothing verifying it          | Write the scenario, or delete the Rule                            |
| `scenario(s) outside of any Rule block`       | Scenario at feature level                      | Nest it under the Rule it verifies                                |
| `has no description`                          | Feature with no prose                          | Add two or three sentences after `Feature:`                       |

### The vague-language check

Rejected terms fall into six categories — vague adverbs (`efficiently`,
`gracefully`, `correctly`, `quickly`, `immediately`), unmeasurable adjectives
(`robust`, `reliable`, `seamless`, `graceful`), vague quantifiers (`various`,
`several`, `most`), escape clauses (`as needed`, `if possible`,
`when applicable`), continuation terms (`etc.`, `such as`, `and/or`), and
indefinite temporal terms (`timely`, `promptly`, `in real time`).

`scripts/spec-audit.ts` holds the authoritative list.

These are not style nits. "Handles errors gracefully" cannot fail a review,
because no reader can say it was not met. Ask what the test asserts:

```gherkin
# REJECTED
Rule: The client shall handle rate limiting gracefully.

# ACCEPTED
Rule: If ESI answers with HTTP 420, then the rate limiter shall stop issuing requests until the error window resets.
```

### The ratchet

`scripts/spec-audit-exceptions.json` lists files exempt from the audit. It is
currently **empty** and should stay that way.

It ratchets: a listed file that starts passing **fails** the run until its entry
is removed, so the list can only shrink. Never add an entry — a new feature file
is compliant from the start.

`--ignore-exceptions` checks a file as if the list were empty. Useful when
converting several files in parallel, so nobody has to touch the shared JSON
mid-flight.

## Walkthrough: adding a new endpoint

1. **Read the contract.** Check `src/core/endpoints/*Endpoints.ts` and the
   generated spec metadata for auth scope, cache TTL, and pagination style. The
   requirement must match what ESI actually guarantees.

2. **Write the Rule** in the domain's feature file. This one is real — it is
   `0002-character.feature`, and it names the exact fields the scenario
   asserts rather than saying "returns medal information":

   ```gherkin
   Rule: When medals are requested for a character ID, the Characters client shall return an array whose entries each carry medal_id, title, description, and date.
     Medals are awarded by a corporation and carry free text supplied by the
     issuer. The four fields named here are the ones a display surface needs
     to render an award without a second lookup.
   ```

   Note that `MedalSchema` has more fields than four. The requirement names the
   ones the scenario actually checks — naming all of them would overstate the
   coverage.

3. **Write the scenario** under it — and the error cases the client really
   handles: 404, 403, 420, 5xx, empty collection, last page.

4. **Confirm RED.**

   ```bash
   npx jest --config jest.unit.config.cjs --testPathPatterns=character
   ```

   It must fail. A scenario that passes before you touch `src/` is testing
   nothing. This step is the entire point; do not skip it.

5. **Write the steps** with `fetchMock`, matching `test('...')` to the scenario
   name exactly.

6. **Implement** the smallest change that satisfies the requirement.

7. **Confirm GREEN**, then:

   ```bash
   npm run spec:audit
   npx prettier --write tests/bdd/step-definitions/core/character.steps.ts
   ```

## Anti-patterns

Each of these was found in this repo during the conversion.

**Asserting on your own mock.** `jest.spyOn` the method, call it, assert the
value came back. Tests Jest, not the client. See
[Wiring the step definitions](#wiring-the-step-definitions).

**`toHaveBeenCalledWith` on the test's own arguments.** Verifies Jest's
bookkeeping. For void-returning `DELETE`/`PUT` endpoints, assert the request
`fetchMock` received — method, URL, body — not that the spy was called.

**Naming middleware the mock guarantees is unreachable.** A scenario titled
"shall respect the rate limit" that stubs the client method never reaches the
rate limiter. Either exercise the middleware or do not claim it.

**Bare loops over a mocked array.** `for (const x of result) expect(x.id)…`
passes vacuously when the array is empty. Assert the length first.

**Errors asserted only as `instanceof EsiError`.** `TestDataFactory.createError`
returns an `EsiError` directly, so this asserts the factory works. Assert the
status code too — otherwise a 500 scenario and a 503 scenario are the same test.

**Fixture contradicting the endpoint.** Stubbing `getCorporationStandings` with
wallet fixtures (usually silenced with `as any`) means the scenario passes
whatever the endpoint returns. `fetchMock` plus the real Zod schema makes this
impossible, which is one of the better reasons to convert.

## Known limitations

**jest-cucumber collapses Rules.** Version 4.5.0 depends on
`@cucumber/gherkin ^28` and parses `Rule:` blocks correctly, which is why this
convention needed no framework migration. But `collapseRulesAndBackgrounds`
flattens each Rule's children into the feature's scenario list and discards the
Rule title. Consequences:

- Rule titles are not addressable from `defineFeature` and do not appear in
  Jest output. The requirements are visible in the feature files and in the
  audit, not in the test report.
- A Rule-level `Background:` _is_ supported — it is merged with the feature-level
  Background and applied to that Rule's scenarios.
- Scenario names must therefore be unique within the whole file, not just
  within their Rule.

**Spec-side only.** The audit checks feature files. It cannot check step
definitions for unused or duplicated steps, because that needs cucumber-js
`--dry-run` JSON and this project uses jest-cucumber. Step hygiene is review's
job.

**The audit cannot tell whether a scenario can fail.** It verifies that
requirements are well-formed, not that they are enforced. Nothing mechanical
catches a tautological scenario — that is why
[The one rule that matters](#the-one-rule-that-matters) is a human
responsibility.
