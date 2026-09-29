# Issue Tracking with Beads (`bd`)

ESI.ts uses [**beads**](https://github.com/gastownhall/beads) (`bd`) as its work
tracker. Beads is a lightweight, git-native issue tracker with **first-class
dependency support** — issues are "chained like beads", so you always know what
is ready to work on and what is blocked by something else.

Issues live in a Dolt database under `.beads/` (the binary DB is gitignored). A
human-readable snapshot is exported to [`.beads/issues.jsonl`](../.beads/issues.jsonl),
which **is** committed, so issues travel with the repo and show up in diffs and PRs.

## Why beads here

- **Dependencies, not just a list** — `bd ready` shows only unblocked work;
  `bd blocked` shows what is waiting and on what.
- **Epics with roll-up** — parent/child hierarchies with completion percentages.
- **Agent-friendly** — Claude Code and Codex are wired to create, link, and
  query issues automatically (see [Agent integration](#agent-integration)).

## Install

```bash
# See https://github.com/gastownhall/beads for install options
bd version    # verify the CLI is available
```

## One-time local setup

`.beads/` (config, hooks, metadata) is committed, so cloning the repo is enough
to read and query issues. Two things are intentionally **local-only**:

1. **Agent integration** — enables the SessionStart hook in the gitignored
   `.claude/settings.json`:

   ```bash
   bd setup claude      # or: bd setup codex, bd setup cursor, ...
   ```

2. **Sync remote** — the remote is _not_ tracked (so forks and alternate
   remotes work). Point it at your remote if you intend to sync:

   ```bash
   bd config set sync.remote "git+https://github.com/<you>/ESI.ts.git"
   ```

## Daily workflow

```bash
bd ready                 # what can I pick up right now?
bd show <id>             # full detail of an issue
bd update <id> --claim   # take ownership / mark in-progress
bd close <id>            # mark complete
bd blocked               # what is waiting, and on what
```

## Viewing issues

```bash
bd list                  # tree view with parent/child nesting
bd list --tree           # explicit hierarchy
bd show <id>             # single issue detail
bd dep tree <id>         # dependency graph for an issue
bd stats                 # counts by status / priority
bd query "status:open priority:1"   # filtered query language
```

You can also just read [`.beads/issues.jsonl`](../.beads/issues.jsonl) — one JSON
object per issue, including labels, dependencies, and comments.

## Creating issues

```bash
# Simple task
bd create "Fix pagination off-by-one in MarketClient" -t bug -p 1

# With a description
bd create "Add ETag support to X" -t feature -d "Detailed context here..."
```

Types: `bug | feature | task | chore | epic | decision`.
Priorities: `0`–`4` (`P0` highest).

### Epics and dependencies

```bash
# Create an epic, then attach children to it
EPIC=$(bd create "Improve OpenSSF Scorecard" -t epic -p 1 --silent)
bd create "Fix Token-Permissions" -t chore -p 1 --parent "$EPIC"

# Link a blocking dependency: <blocked> is blocked by <blocker>
bd link <blocked-id> <blocker-id>              # default type: blocks
bd link <id-a> <id-b> --type related           # non-blocking relation
```

Once a blocker is closed, the blocked issue automatically appears in `bd ready`.

## Syncing issues

Beads stores issues in a Dolt DB and syncs via `refs/dolt/data` on your git
remote; `.beads/issues.jsonl` is a **passive export** for humans and diffs, not
the source of truth.

- **After changing issues**, refresh the tracked snapshot before committing:

  ```bash
  bd export -o .beads/issues.jsonl
  git add .beads/issues.jsonl
  ```

  (Or enable automatic export once: `bd config set export.auto true`.)

- **Cross-machine / team sync** uses Dolt remotes, not the JSONL file. Set
  `sync.remote` locally first (see [One-time local setup](#one-time-local-setup)).

See the [beads sync concepts](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md)
for the full model and anti-patterns.

## Agent integration

`CLAUDE.md` and `AGENTS.md` only point here and at `bd prime`; this section is
the one copy of the agent rules. They are task-tracking guidance and never
override repository, user or orchestrator instructions.

- Use `bd` for all durable task tracking, not markdown TODO lists; keep
  persistent project knowledge in Beads via `bd remember`.
- Run `bd prime` when the Beads context is missing or stale.
- **Git policy (conservative, the default):** do not commit, push or run
  `bd dolt push` unless explicitly asked. Only a repository that opts in to the
  team-maintainer profile lets agents close beads, run the quality gates,
  commit and push at session close, and a current "do not push" still wins.

### Session completion

1. File beads for any remaining follow-up work.
2. If code changed, run the quality gates (tests, linters, build).
3. Close finished beads and update in-progress ones.
4. Sync by the active profile: by default report `git status` and the proposed
   commands and wait; with the team-maintainer opt-in run `git pull --rebase`,
   `bd dolt push`, `git push`, `git status`.
5. Hand off: changes, validation, bead status, and any blocked sync or push
   with its exact command and error.

## Gotchas

- **`bd list` reads the live Dolt DB, not the JSONL.** If the two disagree,
  re-run `bd export -o .beads/issues.jsonl`.
- **`.claude/settings.json` is gitignored**, so the SessionStart hook is
  per-contributor — run `bd setup claude` locally to enable it.
- **`git config core.hooksPath` points at `.beads/hooks`** after `bd init`; the
  existing `lint-staged` pre-commit gate is preserved there.
