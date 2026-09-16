# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd prime` for full workflow context.

> **Architecture in one line:** Issues live in a local Dolt database
> (`.beads/dolt/`); cross-machine sync uses `bd dolt push/pull` (a
> git-compatible protocol), stored under `refs/dolt/data` on your git
> remote — separate from `refs/heads/*` where your code lives.
> `.beads/issues.jsonl` is a passive export, not the wire protocol.
>
> See [SYNC_CONCEPTS.md](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md)
> for the one-screen overview and anti-patterns (don't treat JSONL as the
> source of truth; don't `bd import` during normal operation; don't
> reach for third-party Dolt hosting before trying the default).

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

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

| Area                        | Check                                                                                                                                                                                                                                                                                | Severity |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| Issue authorisation         | The work traces to a bead (`esi-…`) or GitHub issue named in the PR or commits. Work with no trace is not authorised.                                                                                                                                                                | blocker  |
| Issue authorisation         | The scope stays within that bead or issue. Anything unrelated goes in its own PR or bead.                                                                                                                                                                                            | major    |
| Rule coverage (R1)          | Each `Rule:` title is one EARS requirement with exactly one `shall`, and every Scenario sits under the Rule it verifies. `npm run spec:audit` enforces the form.                                                                                                                     | blocker  |
| Rule coverage (R2)          | The Rule claims only what its scenarios assert, and it agrees with the endpoint's `responseSchema` and with pipeline behaviour such as retries, 304 handling and pagination. A Rule that promises more than its tests check is a false specification.                                | major    |
| Transport-seam mocking (R3) | BDD steps queue HTTP responses through the helpers in `tests/bdd/support/`, such as `queueResponse`, on the global `jest-fetch-mock`. No `spyOn(client.*)` or other stub replaces the method under test or `handleRequest`.                                                          | blocker  |
| Failing-first evidence (R4) | The PR shows the new or changed scenario failing before the source change, either as a test commit before the fix or as a RED run quoted in the PR.                                                                                                                                  | major    |
| Failing-first evidence (R4) | A bug fix includes a scenario that reproduces the bug.                                                                                                                                                                                                                               | blocker  |
| Step-file structure (R7)    | New steps live in `tests/bdd/steps/<keyword>/`, one per file, named after the step, and a spec entry in `tests/bdd/specs/` binds the feature. No new `defineFeature` file, and no entry added to `legacyStepFiles`. `npm run spec:audit` and `npm run bdd:steps` enforce the layout. | major    |
| Step-file structure (R8)    | Step bodies delegate to `tests/bdd/support/` (`support/<domain>.ts` for a converted domain) or `tests/bdd/step-definitions/shared/`. They contain no inline URLs, fixture assembly or response construction.                                                                         | minor    |
| Generated files             | No manual edits in `src/types/generated/`, `src/core/endpoints/esi-*.generated.ts`, `etc/esi.ts.api.md` or `okf/`. Changes there come only from the generator command, run in the same PR.                                                                                           | blocker  |
| Spec exceptions             | `scripts/spec-audit-exceptions.json` only shrinks.                                                                                                                                                                                                                                   | blocker  |
| Skills (R14)                | A change to `.claude/skills/**` bumps `skill.version` in that skill's `eval/eval.yaml` and passes `skill-eval.yml`, both the deterministic and the live tier.                                                                                                                        | blocker  |

CI enforces some rows: the spec audit, the exception ratchets, the step layout and dry run, and the skill eval. The reviewer still owns the rest: R2, R4, R8 and authorisation.

<!-- prettier-ignore-start -->
<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
<!-- prettier-ignore-end -->
