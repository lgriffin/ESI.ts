# Contributing to ESI.ts

Thank you for helping. This page is the one path from a fresh clone to a merged pull request. It lists every check CI runs that a first pull request usually trips, so nothing on the pull request should surprise you.

## 1. Prerequisites

| Need              | Why                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Node.js 22.12+    | `engines` floor; `.nvmrc` pins 22                                                                          |
| npm               | The lockfile is npm's; use `npm ci`                                                                        |
| About 8 GB of RAM | Type-aware ESLint over `src/`, `tests/` and `scripts/` runs with a 4 GB heap (`npm run lint` sets it)      |
| uv (optional)     | `npm run lint:workflows` runs zizmor through `uvx`. Without it, `check:local` reports that tier as not run |
| Docker (optional) | Only for `fuzz:api`, `mock:esi` and `contract:diff`, which CI and the nightlies run anyway                 |

## 2. Set up

```bash
git clone https://github.com/<your-username>/ESI.ts.git   # your fork
cd ESI.ts
npm ci                       # also builds dist/ through the prepare script
npm test                     # unit and BDD suites, about three minutes
```

`npm test` is quiet by design: the library's own log lines are silenced under test. `ESI_LOG_LEVEL=warn npm test` shows them.

## 3. Find something to work on

Issues labelled [`good first issue`](https://github.com/lgriffin/ESI.ts/labels/good%20first%20issue) are bounded, need no product decision, and each one names the committed baseline that proves it is done. GitHub issues are the public tracker; the maintainer's own planning also lives in Beads ([guides/BEADS.md](guides/BEADS.md)), which you do not need.

For something not on the list, open an issue first if it changes behaviour, so the requirement can be agreed before code is written.

## 4. Make the change

Read the guide for the kind of change you are making:

| You are…                               | Read                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Changing what the client does          | [tests/bdd/GUIDE.md](tests/bdd/GUIDE.md): write the EARS `Rule:` and a failing scenario first (TEST-01)             |
| Adding or fixing an endpoint or schema | [guides/DESIGN-RULES.md](guides/DESIGN-RULES.md) §3, which walks one operation end to end                           |
| Adding a test                          | [guides/TESTING.md](guides/TESTING.md#adding-tests)                                                                 |
| Migrating a legacy BDD step file       | [tests/bdd/README.md](tests/bdd/README.md), the `legacyStepFiles` list in `scripts/spec/spec-audit-exceptions.json` |
| Touching CI, release or supply chain   | [guides/QUALITY-GATES.md](guides/QUALITY-GATES.md), [guides/SECURITY.md](guides/SECURITY.md)                        |

Two rules hold whatever the change:

- **The custom clients are the product.** `EsiClient`, `EsiClientBuilder`, `EsiApiFactory` and the 39 domain clients are never deprecated or replaced by the generated layer ([CHARTER.md](guides/CHARTER.md) posture 1, ARCH-14). A test fails a change that tries.
- **No floor is lowered.** Every baseline and threshold in this repo is shrink-only or ratchets up.

## 5. Check before you push

```bash
npm run check:local -- --fast   # every offline CI tier except the build, about nine minutes
npm run check:local             # the same plus the build, size budgets, packed-package and docs-example checks
```

Every tier runs even after one fails, and the summary names the command to re-run. A tier whose tool is not installed (uv) shows `n/a` and does not fail the run; CI runs it on your pull request.

`check:local` leaves out the coverage run, because it repeats `npm test` with instrumentation. If you added source code, run `npm run coverage` too: CI fails a pull request that takes branches below 80%, functions below 75%, or lines and statements below 90%.

### CI will fail if…

| …you                                                          | Then run, and commit what it changes                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Added or removed a `Rule:`, scenario, feature file or example | `npm run docs:metrics` (the counts in README and the guides; `validate:versions` checks them) |
| Changed anything exported                                     | `npm run build && npm run api-report` (`etc/esi.ts.api.md`)                                   |
| Added an export                                               | Reference it from a test (`npm run test:export-coverage`)                                     |
| Added a domain-client method                                  | Name it in a `Rule:` or call it from a bound step (`npm run spec:coverage:clients`)           |
| Made the bundle bigger                                        | `npm run build && npm run size`; a raised budget needs a reason in `.size-limit.cjs`          |
| Added a lint warning to a file                                | Fix it; `npm run lint:ratchet` holds warnings per file and rule                               |
| Changed `CLAUDE.md` or `AGENTS.md`                            | Make the same edit to the other; a test keeps their shared sections identical                 |
| Touched a `*.generated.ts` file by hand                       | Revert it and regenerate (`npm run spec:generate` or `npm run generate:types`)                |
| Wrote a test that cannot fail                                 | `npm run lint:suite-health` rejects `.only`, `.skip` and assertion-free tests                 |

## 6. Commit and open the pull request

- **Conventional commits**, enforced by commitlint: `feat:`, `fix:`, `perf:`, `refactor:`, `test:`, `docs:`, `chore:`. The type decides the release, so classify the change with [guides/SEMVER.md](guides/SEMVER.md) first. A breaking change needs `!` and a `BREAKING CHANGE:` footer, and the maintainer's agreement before it is written.
- **Do not edit `CHANGELOG.md`.** release-please writes it from the commit messages.
- **The pull request title** is a conventional commit too, because a squash merge uses it.
- **One logical change per pull request**, targeting `master`.
- Pre-commit hooks run ESLint and Prettier on staged files, so formatting takes care of itself.

CI runs about 35 checks in roughly ten minutes and reports them as one required check, `ci-success`. A failing job's log names the command to reproduce it locally.

## 7. Finding npm commands

There are over 200 npm scripts. Rather than scroll through them:

```bash
npm run help            # grouped overview by intent
npm run help wallet     # any script whose name or hint mentions "wallet"
npm run help bdd        # every BDD scenario group
```

## 8. Reporting bugs and asking questions

Use [GitHub Issues](https://github.com/lgriffin/ESI.ts/issues/new/choose). The bug template asks for the package version, Node version, which surface you used (`EsiClient`, the builder, `createEsi`) and the request with its token removed. Report security problems privately, as [SECURITY.md](SECURITY.md) describes.

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0-or-later license.
