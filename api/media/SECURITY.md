# Security Controls

**Implements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08 — see [CHARTER.md](CHARTER.md#part-6--security)

How ESI.ts defends a consumer at runtime and how the repository defends the package on its way to a registry. The disclosure policy (supported versions, how to report, response timeline, scope) lives in the root [SECURITY.md](../SECURITY.md) and is not repeated here.

Runtime defences live in the request pipeline and are proven by unit tests. Supply-chain defences live in the workflows and are scored weekly. They are one posture.

---

## 1. Runtime defence chain

Every request passes these checks in this order. The first two happen once, when the client is constructed; the rest happen per call.

| #   | Control                       | Where                                                          | Behaviour                                                                                                                                                        |
| --- | ----------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | HTTPS enforced                | `validateBaseUrl` in `src/core/util/validation.ts`             | A base URL whose protocol is not `https:` throws at construction. There is no flag to disable this.                                                              |
| 2   | Host allowlisted              | same                                                           | Only `esi.evetech.net` is allowed. Any other host throws unless `unsafeAllowCustomHost: true` is set.                                                            |
| 3   | Path parameters checked       | `validatePathParam`, called from `buildEndpointPath`           | Rejects empty values, non-finite numbers and any of `/ \ ? # @ ! $ & ' ( ) * + , ; = < > { } \| ^` and backtick. The value is then `encodeURIComponent`-encoded. |
| 4   | Query parameters bounded      | `validateQueryParam`, called from `buildEndpointPath`          | Rejects `null`, non-finite numbers and values longer than 2000 characters. The value is then encoded.                                                            |
| 5   | Token gated by the definition | `buildRequestHeaders` in `src/core/requestPipeline/headers.ts` | The `Authorization` header is attached only when the endpoint definition sets `requiresAuth`. A missing token throws `NO_AUTH_TOKEN` before any network call.    |
| 6   | URLs sanitised in errors      | `sanitizeUrl` in `src/core/util/error.ts`                      | `EsiError.url` and the `EsiValidationError` message pass through it. See below.                                                                                  |

All validation failures throw an `Error` typed `VALIDATION_ERROR`. The error family is described in [ERRORS.md](ERRORS.md).

### Construction

`EsiClient`, `EsiClientBuilder` and `EsiApiFactory` all call `validateBaseUrl` with the configured `baseUrl`, falling back to `ESI_BASE_URL` and then `https://esi.evetech.net`. `unsafeAllowCustomHost` relaxes the host check only. It exists for test servers and proxies, and its name is meant to show up in code review.

### Path and query encoding

The unsafe-character check and the encoding step do different jobs. The check refuses values that would change the route (`../`, `?`, `#`, `@`). The encoding step neutralises anything else: a `%2f` or a null byte in a path parameter is not rejected, but it reaches ESI as a literal `%252f` or `%00` inside a single path segment and cannot introduce a new one.

### Token handling

- The bearer token is attached only where the definition declares `requiresAuth: true`. Public endpoints never see it, even when the client holds a token.
- `npm run validate:auth-scopes` checks that `requiresAuth` is set if and only if the generated scope map lists a scope for the endpoint (DES-04). A mismatch either leaks a token or breaks a call. See [DESIGN-RULES.md](DESIGN-RULES.md).
- The token travels only in the `Authorization` header, never in a query string.
- `FileTokenStorage` in `src/auth/storage` writes to a sibling temporary file and renames it over the target, with POSIX mode `0o600` by default.

### Cache isolation

`buildCacheKey` in `src/core/cache/cacheKey.ts` returns the bare URL for public endpoints, so they share one cache entry. For an endpoint with `requiresAuth`, the key is prefixed with the caller's identity: `character:<id>` from the `sub` claim of an EVE SSO access token, or the first 16 hex characters of a SHA-256 hash of the `Authorization` header for a token that names no character. The claim is decoded, not verified, so it counts only once ESI has answered a request under that token with 2xx or 304 (`markTokenAccepted` in `cacheKey.ts`, called from `fetchExecution.ts`). Until then the token is keyed by its hash wherever an entry would be served without a request (the spec-TTL hit, stale-on-error, joining an in-flight request), and the character's ETag is sent only as `If-None-Match`: ESI's 304 accepts the token and serves the entry in one answer, and a 401 serves nothing. A forged token naming a character therefore reads none of that character's cache, two characters never share a cached body or ETag, a refreshed token keeps its character's entries, and the token never appears in a key in clear text.

### URL sanitisation

`sanitizeUrl` replaces the value of any of these query parameters with `[REDACTED]`: `token`, `access_token`, `api_key`, `refresh_token`, `client_secret`, `code`, `key`, `secret`, `auth`, `password`, `bearer`. If the URL cannot be parsed, everything after `?` is replaced with `[params-redacted]`. The function is exported from the root and from `@lgriffin/esi.ts/errors` for consumers who log URLs themselves.

Log lines pass through `sanitizeUrl` too, at the logger boundary: every URL in a line's message and top-level string context values is redacted before any logger, per-client or global, receives it. A custom request interceptor that adds a secret to the URL therefore sees `[REDACTED]` in the `Hitting endpoint: <url>` line, not the secret. Logging configuration and what is not redacted are covered in [LOGGING.md](LOGGING.md#secrets-in-log-output).

---

## 2. Security test suite

`tests/tdd/core/security.test.ts` is the executable form of the defence chain. Each `describe` group proves one control.

| Group                                    | Proves                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| `Security: Token Handling`               | No `Authorization` header on a public endpoint; the header is present on an authenticated one |
| `Security: HTTPS Enforcement`            | `http://` is rejected by the client constructor and by `validateBaseUrl` directly             |
| `Security: Host Allowlist`               | Unknown hosts are rejected by default and accepted only with the unsafe flag                  |
| `Security: Path Parameter Injection`     | `../`, `?`, `#`, `\`, `/` and `@` are rejected; ordinary IDs and names pass                   |
| `Security: Query Parameter Length Limit` | A query value over 2000 characters is rejected; one within the limit passes                   |
| `Security: NaN/Infinity Path Params`     | `NaN`, `Infinity` and `-Infinity` are rejected as path parameters                             |
| `Security: Null/Empty Path Params`       | `null`, `undefined` and the empty string are rejected as path parameters                      |

Controls tested outside that file:

| Control              | Test file                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| URL sanitisation     | `tests/tdd/core/error.test.ts`, `tests/tdd/core/EsiError.test.ts`                       |
| Per-token cache keys | `tests/tdd/core/cacheKey.test.ts`, `tests/tdd/core/requestPipeline/cachePolicy.test.ts` |

```bash
npx jest --config config/jest/unit.config.cjs tests/tdd/core/security.test.ts
npm test   # includes the security suite
```

---

## 3. Supply-chain hardening

Which workflow runs at which stage, and whether it blocks, is set out in [QUALITY-GATES.md](QUALITY-GATES.md). This section states what each control does.

### Workflows

| Control                   | Mechanism                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Actions pinned by SHA     | Every `uses:` references a full 40-character commit SHA with the version as a trailing comment. A retagged upstream action cannot change what runs.                                                                                                                                                                                                                                  |
| Least-privilege tokens    | Every workflow declares top-level `permissions:` as `contents: read` (CodeQL declares `{}`; Scorecard `read-all`, as its action requires). Jobs escalate individually, for example `id-token: write` only on publish and signing jobs. `tests/tdd/workflows/workflow-permissions.test.ts` fails on a missing or writable top level and on any job-level write scope not in its list. |
| No credential persistence | Every checkout step sets `persist-credentials: false`.                                                                                                                                                                                                                                                                                                                               |
| No expression injection   | `run:` blocks read event data through `env:` bindings rather than interpolating `${{ }}` into shell.                                                                                                                                                                                                                                                                                 |
| zizmor                    | `zizmor.yml` audits `.github/` on any push or PR that touches workflows or `.zizmor.yml`. Accepted findings are listed with reasons in `.zizmor.yml`.                                                                                                                                                                                                                                |
| CodeQL                    | `codeql.yml` on push and PR to `master`, and weekly.                                                                                                                                                                                                                                                                                                                                 |
| OpenSSF Scorecard         | `scorecard.yml` weekly; results are published and uploaded as SARIF to code scanning.                                                                                                                                                                                                                                                                                                |
| Dependabot                | `.github/dependabot.yml` opens weekly PRs for npm dependencies and for GitHub Actions, which keeps pinned SHAs current.                                                                                                                                                                                                                                                              |

### Dependency advisories

`scripts/quality/audit-check.ts` wraps `npm audit` with an acceptance allowlist in `scripts/quality/audit-exceptions.json`.

- **`--diff`** fails a pull request only if it introduces an advisory the base branch did not have. A disclosure published against an existing dependency does not block unrelated work.
- **`--check`** fails if the tree has an unaccepted advisory at or above a level (default `high`). The release gate runs it as `npm run audit:check`.
- **`--filter`** strips accepted advisories from a report so the nightly audit does not re-file them.

Every exception needs a GHSA id, package, severity, reason and `expires` date. An expired exception is a hard failure, so acceptance is revisited rather than becoming permanent (SEC-05). The procedure for adding one is in [QUALITY-GATES.md](QUALITY-GATES.md).

### Published artefacts

- **npm provenance.** Both publish jobs in `release.yml` (npmjs.org and GitHub Packages) run `npm publish --provenance` with `id-token: write`, so a consumer can verify the tarball was built by this repository's workflow.
- **Signed release assets.** `create-assets` builds the tarball, its SBOM and the documentation archive and writes `checksums.txt` with SHA-256. A separate `sign-and-publish-assets` job, the only one allowed to mint an OIDC token for signing, signs each asset with keyless `cosign sign-blob` and uploads a Sigstore bundle (`.sigstore.json`) beside it. The same job attests SLSA build provenance for the three assets with `actions/attest-build-provenance`, checks it with `gh attestation verify`, and attaches the bundle as `lgriffin-esi.ts-X.Y.Z.intoto.jsonl`.
- **SBOM (SEC-06).** Provenance says who built the package; an SBOM says what is inside it. Each release attaches `lgriffin-esi.ts-X.Y.Z.cdx.json`, a CycloneDX bill of materials for the tarball's runtime dependency tree, generated by `npm sbom` (no extra tooling) and checked by `scripts/release/release-sbom.ts` before it is signed. What it covers and how to verify it is in [RELEASE.md](RELEASE.md#verifying-a-release).

How a release is cut and how to verify its assets is covered in [RELEASE.md](RELEASE.md).

---

## 4. Local credentials

`npm run token:create` runs `scripts/auth/create-token.ts`, which performs the EVE SSO PKCE flow against a local callback on `http://localhost:3000/sso_callback` and writes the resulting tokens to `.env`. `npm run token:refresh` renews them.

- `.env` and `.env.test` are git-ignored. `.env.example` is the only environment file in git and holds no values.
- Credentials never appear in committed fixtures, snapshots or examples. Tests that need a real token read it from `.env` and are gated behind `ESI_GATED_TESTS` (see [TESTING.md](TESTING.md)).
- If a token is committed by mistake, revoke it in the EVE developer portal first; rewriting history does not un-leak it.

---

## 5. Settings only the maintainer can change

Everything above lives in the repository and is checked by CI. What follows lives in GitHub and npm settings: nothing in a pull request can change it and nothing in the repository can see it, so each item says how to verify it once done. These are the OpenSSF Scorecard checks the repository cannot move on its own ([#239](https://github.com/lgriffin/ESI.ts/issues/239)), and the remaining half of SEC-07 ([#270](https://github.com/lgriffin/ESI.ts/issues/270), bead `esi-wze`).

The repository side is done: every workflow declares read-only top-level permissions and `tests/tdd/workflows/workflow-permissions.test.ts` lists each job-level write scope (Token-Permissions); each release attaches cosign bundles, the CycloneDX SBOM and a `.intoto.jsonl` provenance file (Signed-Releases); `.github/CODEOWNERS` assigns every path to `@lgriffin`.

### Branch protection on `master` that includes administrators (SEC-07, Branch-Protection)

In **Settings → Rules → Rulesets** (or the classic **Settings → Branches** rule, recorded in bead `esi-8we`), for `master`:

1. Leave the bypass list empty, or in the classic rule tick **Do not allow bypassing the above settings** ("Include administrators"). This is the SEC-07 item.
2. **Require a pull request before merging**, with at least one approval, **Require review from Code Owners**, **Dismiss stale approvals** and **Require approval of the most recent push**.
3. **Require status checks to pass**, with `ci-success` as the only required check and **Require branches to be up to date** on ([QUALITY-GATES.md](QUALITY-GATES.md#what-actually-blocks-a-merge)).
4. Keep force-pushes and deletion blocked.

With one maintainer and administrators included, a pull request the maintainer authored cannot be merged until someone else approves it, because GitHub does not let authors approve their own. Scorecard's higher Branch-Protection tiers need that, and its Code-Review check ([#243](https://github.com/lgriffin/ESI.ts/issues/243)) counts only merges that someone other than the author approved. Deciding that a second reviewer is required is the maintainer's call; the lower tiers (no force-push, no deletion, required checks, administrators included) are available without one.

Verify, and record the answer in the CHARTER's SEC-07 row when it shows administrators included:

```bash
gh api repos/lgriffin/ESI.ts/branches/master/protection \
  --jq '{admins: .enforce_admins.enabled, approvals: .required_pull_request_reviews.required_approving_review_count, codeowners: .required_pull_request_reviews.require_code_owner_reviews, checks: .required_status_checks.contexts}'
# or, for rulesets: the rules GitHub applies to master, whichever ruleset they come from
gh api repos/lgriffin/ESI.ts/rules/branches/master \
  --jq 'map({type, ruleset: .ruleset_id, parameters})'
# and, per ruleset id listed above, whether anyone can bypass it
gh api repos/lgriffin/ESI.ts/rulesets/<id> --jq '{name, enforcement, bypass: .bypass_actors}'
```

Scorecard reads classic branch protection only through a token with administration read access. If the Branch-Protection check reports that it could not read the settings, add a fine-grained token with **Administration: read** on this repository as a secret and pass it to the scorecard step as `repo_token`; that edit to `scorecard.yml` is for the pull request that adds the secret, because an empty `repo_token` would break the run.

### OpenSSF Best Practices badge (CII-Best-Practices)

Register the project at [bestpractices.dev](https://www.bestpractices.dev/) and answer the passing-level criteria ([#246](https://github.com/lgriffin/ESI.ts/issues/246)). Most answers point at files that already exist: `SECURITY.md` for the reporting process, this guide, `guides/QUALITY-GATES.md` for the tests and CI, `guides/RELEASE.md` for signing. Registration gives a project number; a pull request then adds the badge to the README.

### npm trusted publishing (ROADMAP Phase 6 item 3)

`publish-npm` still authenticates with the `NPM_TOKEN` secret. Configure a trusted publisher for `@lgriffin/esi.ts` on npmjs.com (repository `lgriffin/ESI.ts`, workflow `release.yml`) first; the workflow change that drops `NODE_AUTH_TOKEN` follows, and the secret is deleted after the first release published through it.

### Signed releases need releases

Scorecard's Signed-Releases check reads the assets of the last five GitHub releases. v10.2.0 carries cosign bundles; v10.2.2 and v10.2.3 carry no assets at all (checked 2026-09-27), so the check stays low until the releases in that window went through `sign-and-publish-assets`. Re-running `release.yml` on an old tag would also try to publish to npm again, so the fix is forward: make sure each new release's run finishes. After the next release, confirm its assets include the `.sigstore.json` bundles and the `.intoto.jsonl` file (`gh release view vX.Y.Z --json assets --jq '.assets[].name'`).
