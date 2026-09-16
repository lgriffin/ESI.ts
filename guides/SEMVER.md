# Semantic Versioning

**Implements:** `REL-01`, `REL-05`, `REL-06`, `GATE-03` · requirements stated in [CHARTER.md](CHARTER.md) Part 8

How to decide whether a change to `@lgriffin/esi.ts` is a major, minor or patch release, and how to say so in a commit so the published version is right. [RELEASE.md](RELEASE.md) covers what happens after the commits land: release-please, the changelog, publishing and signing.

The version number is a promise to every consumer. `^9.9.0` in someone's `package.json` means "install any 9.x.y release without my code breaking". A breaking change released as a minor breaks every one of those installs on their next `npm install`. A harmless change released as a major makes consumers read migration notes that do not exist. Both are bugs.

---

## The three numbers

`MAJOR.MINOR.PATCH`, following [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

| Bump      | When                                                                              | Commit                                                   |
| --------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Major** | Code that compiled and ran against the previous release can fail against this one | `type!:` subject and a `BREAKING CHANGE:` footer         |
| **Minor** | New capability; everything that worked before still works the same way            | `feat:`                                                  |
| **Patch** | A fix or internal change with no new capability and nothing removed               | `fix:`, `perf:`, `refactor:`, `chore:`, `docs:`, `test:` |

The package is past 1.0, and release-please runs with `bump-minor-pre-major: false`, so these rules apply exactly as written. There is no "it's only a minor break".

---

## What the public contract is

Everything a consumer can reach without importing from `dist/` by path:

- **Every entry point in `package.json` `exports`:** `.`, `./schemas`, `./errors`, `./testing`, `./sde`, `./sde/memory`, and `./package.json`. `./testing` (`TestDataFactory` and friends) is public; consumers use it in their own tests.
- **The types those entry points export.** That includes interfaces consumers _implement_, such as `ILogger`, `ICircuitBreaker`, `IDeduplicator` and `IRetryStrategy`, as well as ones they only call.
- **Runtime behaviour documented in the guides.** This covers which error class is thrown and its `retryable` flag ([ERRORS.md](ERRORS.md)), what a response schema accepts ([RUNTIME-VALIDATION.md](RUNTIME-VALIDATION.md)), pagination results ([PAGINATION.md](PAGINATION.md)), default configuration values, and log events other code may key on ([LOGGING.md](LOGGING.md)).
- **The environment.** `engines.node`, `dependencies` whose types appear in the public API (`zod`), and `peerDependencies` (`better-sqlite3`).

Not public: anything not reachable from an entry point, file layout under `src/`, test files, CI, generated files' internal shape where no exported type depends on it, and log message wording.

---

## Deciding

Ask: **could code that works against the last release stop compiling, throw, or return something different?** If yes, the change is major. The tables below cover the cases that come up in this repository.

### Exports and signatures

| Change                                                                    | Bump  | Why                                                                                                              |
| ------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------- |
| Add an export, a client method, a sub-path export or an endpoint          | minor | Nothing existing changes                                                                                         |
| Remove or rename an export, method, sub-path or endpoint                  | major | Importers stop compiling                                                                                         |
| Add an **optional** parameter or an optional config field                 | minor | Existing calls still type-check and behave the same                                                              |
| Add a **required** parameter, or make an optional one required            | major | Existing calls stop compiling                                                                                    |
| Narrow a parameter type (`number \| string` → `number`)                   | major | Callers passing the removed type stop compiling                                                                  |
| Widen a parameter type (`number` → `number \| string`)                    | minor | Existing calls still compile                                                                                     |
| Widen a return type (`T` → `T \| undefined`)                              | major | Callers must handle a case they never saw                                                                        |
| Narrow a return type (`T \| undefined` → `T`)                             | minor | Existing handling still compiles                                                                                 |
| Add a **required** member to an interface consumers implement (`ILogger`) | major | Their implementations stop compiling. The API report shows only an added line, so the gate cannot catch this one |
| Add an **optional** member to such an interface                           | minor | Existing implementations still satisfy it                                                                        |
| Add a required member to a type the library only returns                  | minor | Consumers read it; they never construct it                                                                       |

### Runtime behaviour

| Change                                                                                               | Bump                                     | Why                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Throw a different error class, or flip `retryable`, for an existing case                             | major                                    | `instanceof` checks and retry logic in consumer code change behaviour                                                                                    |
| Tighten a Zod response schema (a field becomes required, an enum loses a member)                     | major                                    | Responses that validated before now throw `EsiValidationError` at runtime                                                                                |
| Make a response field optional in a Zod schema                                                       | major                                    | The inferred type widens to `T \| undefined`, so consumer code that reads the field can stop compiling. This holds even when ESI already omits the field |
| Add a member to an ESI enum union in a response schema                                               | minor                                    | ESI enums are open by design (CHARTER principle 3): consumers must not switch on them exhaustively. `z.looseObject` keeps unknown fields regardless      |
| Change a default that alters results: retry count, cache on or off, validation on or off, datasource | major                                    | Same code, different outcome                                                                                                                             |
| Change a default that only alters timing or resource use, within documented bounds                   | patch                                    | Results are the same                                                                                                                                     |
| Fix a bug so the documented behaviour now happens                                                    | patch                                    | The contract was already stated; the code now meets it                                                                                                   |
| Fix a bug that consumers could reasonably depend on (an error that was swallowed now throws)         | major, or patch with a changelog warning | Decide in the pull request and write the reason down; when unsure, ask the maintainer                                                                    |
| Performance improvement with identical results                                                       | patch                                    | `perf:`                                                                                                                                                  |

### Environment and dependencies

| Change                                                             | Bump  | Why                                          |
| ------------------------------------------------------------------ | ----- | -------------------------------------------- |
| Drop a Node line (raise `engines.node`)                            | major | REL-05; installs on that line stop working   |
| Major version of a dependency whose types are public (`zod` 4 → 5) | major | Consumers' schemas and inferred types change |
| Raise the minimum of a peer dependency (`better-sqlite3`)          | major | Existing installs no longer satisfy it       |
| Add a new required runtime dependency or peer dependency           | major | Existing installs may break or warn          |
| Patch or minor dependency update with no public type change        | patch | `chore(deps):`                               |

### Changes that come from ESI itself

CCP changes the ESI spec on its own schedule, and `npm run generate:types` follows. Classify the resulting library change by the tables above, not by what CCP called it:

- **ESI adds a field or an endpoint:** minor.
- **ESI removes an endpoint:** deprecate it first (below). Removing the client method is a major release, even though the endpoint no longer works, because removal is what stops consumers' code compiling.
- **ESI stops always sending a field the schema requires:** make it optional, as `fix(schemas)!:`. It fixes validation failures consumers already see, but the inferred type widens, so it is still a major release. Say both in the `BREAKING CHANGE:` footer.

---

## Deprecate before you remove

A removal should never be the first a consumer hears of it.

1. **In a minor release:** mark the export `@deprecated` in JSDoc, naming the replacement. For an endpoint whose ESI operation is deprecated upstream, add `DeprecationInfo` (`message`, `replacedBy`, `sunsetDate`) to its definition, so `createClient` logs a warning on each call. A hand-written method logs through `logWarn(this._client, …)` ([DESIGN-RULES.md](DESIGN-RULES.md) §3.6). Record it in the changelog under **Deprecated**.
2. **Keep it working** for at least one minor release.
3. **In the next major release:** remove it, with a `BREAKING CHANGE:` footer that names the replacement.

When ESI has already removed the endpoint and every call fails, steps 1 and 3 can land in consecutive releases. The method still stays until a major release.

---

## Saying it in the commit

release-please reads commit messages on `master` and nothing else. The only way to get the version right is to write the commit right. commitlint checks the format; it cannot check honesty.

### A breaking change

Put `!` after the type **and** add a `BREAKING CHANGE:` footer that tells a consumer what to do:

```text
feat(market)!: require the order type in getMarketOrders

Fetching both sides of the book by default doubled the payload for the
common case of reading one side.

BREAKING CHANGE: getMarketOrders(regionId) is now
getMarketOrders(regionId, orderType), where orderType is 'buy', 'sell' or
'all'. Pass 'all' to keep the previous behaviour.
```

The `!` triggers the major bump. The footer is the migration note that release-please copies into the changelog. Either one alone bumps the version, but a `!` without a footer ships a major release with no explanation.

### A compatible change the API report flags

Some compatible changes still remove or rewrite a line in `etc/esi.ts.api.md`, such as an optional parameter added to an existing signature. Say why it is compatible with an `API-Compatible:` trailer:

```text
feat(market): accept an optional type filter in getMarketOrders

API-Compatible: the new parameter is optional, so existing calls still type-check and return the same orders.
```

### Which commit carries the marker

- A pull request that contains the break carries the marker on the commit that introduces it.
- **Never** mark a change breaking "to be safe". An unnecessary major release is also a wrong version.
- **Never** hide a break inside a `chore:`, `refactor:` or `test:` commit. The type describes the change to consumers, not the kind of work.

---

## Merging the pull request

GitHub offers three ways to merge a pull request, and they give release-please different commits to read:

| Button               | What lands on `master`                                                                                                                                          | What release-please reads                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Merge commit**     | Every commit from the branch, unchanged, plus one extra "Merge pull request #N" commit that joins the branch to `master`                                        | Each branch commit; the merge commit is ignored |
| **Squash and merge** | One new commit containing all the branch's changes. With several commits, its title is the **pull request title**; with one commit, it is that commit's message | That single commit                              |
| **Rebase and merge** | Every commit from the branch, replayed on top of `master`, with no merge commit                                                                                 | Each branch commit                              |

The consequences:

- **Merge commit or rebase:** each commit's type and markers reach the changelog as written. Use one of these when a pull request mixes types, for example a `fix:` alongside `test:` commits, so each gets its own changelog entry.
- **Squash:** the pull request title becomes the only commit title. It **must** be a conventional commit, and it must carry `!` when any commit in the pull request is breaking. Write any `BREAKING CHANGE:` footer into the squash dialog's message box too. Squash also collapses the changelog to one entry.

---

## What checks it

| Check                                                                                    | What it catches                                                                                                                                                                                                         | Where                                        |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| commitlint                                                                               | A commit message that is not a conventional commit                                                                                                                                                                      | `commit-msg` hook                            |
| API surface diff (GATE-03)                                                               | An exported shape changed without `etc/esi.ts.api.md` being regenerated (`npm run api-report`)                                                                                                                          | `ci.yml` API Surface Check                   |
| `publicApiSurface.test.ts`                                                               | A root export renamed or removed                                                                                                                                                                                        | `npm test`                                   |
| `api-semver` gate (REL-06), added by [#310](https://github.com/lgriffin/ESI.ts/pull/310) | The API report lost or changed a line, but no commit is `type!:`, has a `BREAKING CHANGE:` footer or an `API-Compatible:` trailer; or a declared break spans several commits and the pull request title is not `type!:` | `ci.yml`, `npm run api-report:semver`        |
| Review                                                                                   | Everything else in [Deciding](#deciding): runtime behaviour, schema tightening, defaults, required members on implemented interfaces, sub-paths the report does not cover, dependency changes                           | [AGENTS.md](../AGENTS.md) Reviewer Checklist |

The API report covers only the root entry point, and it cannot see runtime behaviour. The gate is a tripwire for the common case, not a proof. The author is responsible for the classification, and the reviewer checks it.

---

## Checklist for every pull request

1. Does the change touch anything in [the public contract](#what-the-public-contract-is)? If not, it is a patch-level type (`fix:`, `refactor:`, `chore:` and so on) and you are done.
2. Classify it with the tables in [Deciding](#deciding).
3. If an exported shape changed, run `npm run api-report` and commit `etc/esi.ts.api.md`.
4. Breaking: `type!:` plus a `BREAKING CHANGE:` footer with the migration. If it removes something, was it deprecated in an earlier minor release? If not, deprecate first unless ESI has already removed it.
5. Compatible but flagged by the report: an `API-Compatible:` trailer with the reason.
6. Squash-merging several commits: pull request title in conventional form, with `!` if anything is breaking.
