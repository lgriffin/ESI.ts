# tests/bdd — agent notes

This directory is the executable EARS specification. Read these before you
edit anything here:

- [`README.md`](README.md): the rules, meaning one `shall` per `Rule:` and
  every Scenario under a Rule. [`GUIDE.md`](GUIDE.md) shows how to apply
  them.
- The `ears-gherkin-dev` skill (`.claude/skills/ears-gherkin-dev/SKILL.md`)
  gives the workflow: requirement, failing scenario, implementation, audit.
- The reviewer checklist and its severities are in the root
  [`AGENTS.md`](../../AGENTS.md#reviewer-checklist).

## Mock at the transport seam

- Queue HTTP responses with the helpers in [`support/`](support/), for example
  `queueResponse({ status, headers, body })`, on the global `jest-fetch-mock`.
  Set up pipeline pre-conditions with the helpers in the same directory.
- Never `jest.spyOn(client.<domain>, '<method>')`. ESLint bans `spyOn(client.*)`
  in `tests/bdd/**`, because a scenario that stubs the method under test
  cannot fail.
- Do not stub `handleRequest` either (see
  [`src/core/requestPipeline/AGENTS.md`](../../src/core/requestPipeline/AGENTS.md)).

## Before you hand off

```bash
npx jest --config jest.unit.config.cjs --testPathPatterns=<domain>  # RED first, then GREEN
npm run spec:audit
```

`scripts/spec-audit-exceptions.json` only shrinks. Never add an entry to it.
