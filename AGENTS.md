# Agent Instructions

Issue tracking uses Beads (`bd`); see [Beads Issue Tracker](#beads-issue-tracker) at the end of this file.

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**

```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**

- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

## Semantic Versioning (enforced)

Every change is classified by [`guides/SEMVER.md`](guides/SEMVER.md) before it is committed. These rules are mandatory for humans and agents:

- **Classify before committing.** A change that touches the public contract (any `package.json` `exports` entry, types they export, documented runtime behaviour, error classes, Zod response schemas, defaults, `engines`, public or peer dependencies) is major, minor or patch per the tables in SEMVER.md. When the classification is unclear, ask the user rather than guessing.
- **Never introduce a breaking change without the user's explicit approval.** Propose a compatible alternative first: an optional parameter, a new method next to the old one, or a deprecation.
- **Mark breaking changes on the commit that introduces them:** `type!:` in the subject **and** a `BREAKING CHANGE:` footer that tells a consumer how to migrate. Never hide a break in `chore:`, `refactor:` or `test:`, and never add `!` "to be safe".
- **Deprecate before removing.** Removals ship in a major release only, after `@deprecated` JSDoc (and `DeprecationInfo` for endpoints) in an earlier minor release, unless ESI has already removed the endpoint.
- **Keep the API report honest.** When an exported shape changes, run `npm run api-report` and commit `etc/esi.ts.api.md`. If the report loses a line but the change is compatible, add an `API-Compatible: <why>` trailer.
- **Pull request titles are conventional commits.** A squash merge of several commits uses the title as the commit release-please reads, so it carries `!` whenever any commit in the pull request is breaking. Prefer a merge commit when a pull request mixes `fix:`/`feat:` with other types.
- **These rules live in CLAUDE.md and AGENTS.md both.** `tests/tdd/scripts/agent-docs.test.ts` fails if the two copies drift, so an agent cannot read a stale one and ship a break under `fix:`. Edit both, or neither.

## Knowledge Graph

For architecture questions (which modules import the logger, how a request flows to `fetch()`, which tests reach a given source file), use the graphify knowledge graph first when `graphify-out/` exists:

```bash
graphify query "<question>" --graph graphify-out/graph.json
graphify path "<symbolA>" "<symbolB>" --graph graphify-out/graph.json --undirected
graphify god-nodes --graph graphify-out/graph.json
```

The graph is built in a clean worktree; regenerate with `graphify extract <worktree> --code-only` and `graphify cluster-only <worktree> --no-label`. The commit the graph was built from is recorded in `graphify-out/GRAPH_REPORT.md` — check it is current before trusting the answer.

## Reviewer Checklist

Every pull request, whether a human or an agent wrote it, is reviewed against
this list. Area-specific guidance lives next to the code:
[`tests/bdd/AGENTS.md`](tests/bdd/AGENTS.md) and
[`src/core/requestPipeline/AGENTS.md`](src/core/requestPipeline/AGENTS.md).

### Severities

- **blocker**: the change cannot merge until it is fixed.
- **major**: fix it before merge, or defer it to a bead or issue linked from the PR.
- **minor**: the author decides. Record it and move on.

Start each review comment with its severity and area, for example
`blocker — transport seam (R3): …`.

### Checks

| Area                         | Check                                                                                                                                                                                                                                                                                                                                 | Severity |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Issue authorisation          | The work traces to a bead (`esi-…`) or GitHub issue named in the PR or commits. Work with no trace is not authorised.                                                                                                                                                                                                                 | blocker  |
| Issue authorisation          | The scope stays within that bead or issue. Anything unrelated goes in its own PR or bead.                                                                                                                                                                                                                                             | major    |
| Rule coverage (R1)           | Each `Rule:` title is one EARS requirement with exactly one `shall`, and every Scenario sits under the Rule it verifies. `npm run spec:audit` enforces the form.                                                                                                                                                                      | blocker  |
| Rule coverage (R2)           | The Rule claims only what its scenarios assert, and it agrees with the endpoint's `responseSchema` and with pipeline behaviour such as retries, 304 handling and pagination. A Rule that promises more than its tests check is a false specification.                                                                                 | major    |
| Exclusions stated (R2a)      | A behaviour the change deliberately ignores (a status not retried, a header not honoured, a field not validated) is written as an unwanted-behaviour Rule (`If …, then the <system> shall not …`) with a scenario, not left to prose or a code comment (CHARTER TEST-11).                                                             | major    |
| Transport-seam mocking (R3)  | BDD steps queue HTTP responses through the helpers in `tests/bdd/support/`, such as `queueResponse`, on the global `jest-fetch-mock`. No `spyOn(client.*)` or other stub replaces the method under test or `handleRequest`.                                                                                                           | blocker  |
| Failing-first evidence (R4)  | The PR shows the new or changed scenario failing before the source change, either as a test commit before the fix or as a RED run quoted in the PR.                                                                                                                                                                                   | major    |
| Failing-first evidence (R4)  | A bug fix includes a scenario that reproduces the bug.                                                                                                                                                                                                                                                                                | blocker  |
| Step-file structure (R7)     | New steps live in `tests/bdd/steps/<keyword>/`, one per file, named after the step, and a spec entry in `tests/bdd/specs/` binds the feature. No new `defineFeature` file, and no entry added to `legacyStepFiles`. `npm run spec:audit` and `npm run bdd:steps` enforce the layout.                                                  | major    |
| Step-file structure (R8)     | Step bodies delegate to `tests/bdd/support/` (`support/<domain>.ts` for a converted domain) or `tests/bdd/step-definitions/shared/`. They contain no inline URLs, fixture assembly or response construction.                                                                                                                          | minor    |
| Generated files              | No manual edits in `src/types/generated/`, `src/core/endpoints/esi-*.generated.ts`, `src/generated/operations.generated.ts`, `etc/esi.ts.api.md` or `okf/`. Changes there come only from the generator command (`npm run generate:types`, `npm run spec:generate`, `npm run api-report`, `npm run generate:okf`), run in the same PR. | blocker  |
| Semantic versioning (REL-06) | The change is classified per `guides/SEMVER.md`. A break is marked `type!:` with a `BREAKING CHANGE:` migration footer and was approved; removals were deprecated in an earlier minor; a squash-merged multi-commit PR has a conventional title carrying `!` when breaking. No break hides in `chore:`/`refactor:`/`test:`.           | blocker  |
| Spec exceptions              | `scripts/spec/spec-audit-exceptions.json` only shrinks.                                                                                                                                                                                                                                                                               | blocker  |
| Skills (R14)                 | A change to `.claude/skills/**` bumps `skill.version` in that skill's `eval/eval.yaml` and passes `skill-eval.yml`, both the deterministic and the live tier.                                                                                                                                                                         | blocker  |

CI enforces some rows: the spec audit, the exception ratchets, the step layout and dry run, and the skill eval. The reviewer still owns the rest: R2, R4, R8 and authorisation.

<!-- prettier-ignore-start -->
<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->

## Beads Issue Tracker

Work is tracked in Beads (`bd`). Run `bd prime` for the workflow and command
reference; [guides/BEADS.md](guides/BEADS.md) covers setup, sync, the agent git
policy and the session-close steps. Use `bd` for durable task tracking, not
markdown TODO lists.
<!-- END BEADS INTEGRATION -->
<!-- prettier-ignore-end -->
