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

`buildCacheKey` in `src/core/cache/cacheKey.ts` returns the bare URL for public endpoints, so they share one cache entry. For an endpoint with `requiresAuth`, the key is prefixed with the first 16 hex characters of a SHA-256 hash of the `Authorization` header. Two characters requesting the same authenticated path never share a cached body or ETag, and the token never appears in a key in clear text.

### URL sanitisation

`sanitizeUrl` replaces the value of any of these query parameters with `[REDACTED]`: `token`, `access_token`, `api_key`, `refresh_token`, `client_secret`, `code`, `key`, `secret`, `auth`, `password`, `bearer`. If the URL cannot be parsed, everything after `?` is replaced with `[params-redacted]`. The function is exported from the root and from `@lgriffin/esi.ts/errors` for consumers who log URLs themselves.

Log lines written by the pipeline (for example `Hitting endpoint: <url>`) do not pass through `sanitizeUrl`. ESI does not carry credentials in query strings, so in normal use there is nothing to redact, but a custom request interceptor that adds a secret to the URL would see it logged at `info`. Logging configuration is covered in [LOGGING.md](LOGGING.md).

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
npx jest --config jest.unit.config.cjs tests/tdd/core/security.test.ts
npm test   # includes the security suite
```

---

## 3. Supply-chain hardening

Which workflow runs at which stage, and whether it blocks, is set out in [QUALITY-GATES.md](QUALITY-GATES.md). This section states what each control does.

### Workflows

| Control                   | Mechanism                                                                                                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actions pinned by SHA     | Every `uses:` references a full 40-character commit SHA with the version as a trailing comment. A retagged upstream action cannot change what runs.                                                                                    |
| Least-privilege tokens    | Every workflow declares top-level `permissions:` as `contents: read` (CodeQL declares `{}`; Scorecard `read-all`, as its action requires). Jobs escalate individually, for example `id-token: write` only on publish and signing jobs. |
| No credential persistence | Every checkout step sets `persist-credentials: false`.                                                                                                                                                                                 |
| No expression injection   | `run:` blocks read event data through `env:` bindings rather than interpolating `${{ }}` into shell.                                                                                                                                   |
| zizmor                    | `zizmor.yml` audits `.github/` on any push or PR that touches workflows or `.zizmor.yml`. Accepted findings are listed with reasons in `.zizmor.yml`.                                                                                  |
| CodeQL                    | `codeql.yml` on push and PR to `master`, and weekly.                                                                                                                                                                                   |
| OpenSSF Scorecard         | `scorecard.yml` weekly; results are published and uploaded as SARIF to code scanning.                                                                                                                                                  |
| Dependabot                | `.github/dependabot.yml` opens weekly PRs for npm dependencies and for GitHub Actions, which keeps pinned SHAs current.                                                                                                                |

### Dependency advisories

`scripts/audit-check.ts` wraps `npm audit` with an acceptance allowlist in `scripts/audit-exceptions.json`.

- **`--diff`** fails a pull request only if it introduces an advisory the base branch did not have. A disclosure published against an existing dependency does not block unrelated work.
- **`--check`** fails if the tree has an unaccepted advisory at or above a level (default `high`). The release gate runs it as `npm run audit:check`.
- **`--filter`** strips accepted advisories from a report so the nightly audit does not re-file them.

Every exception needs a GHSA id, package, severity, reason and `expires` date. An expired exception is a hard failure, so acceptance is revisited rather than becoming permanent (SEC-05). The procedure for adding one is in [QUALITY-GATES.md](QUALITY-GATES.md).

### Published artefacts

- **npm provenance.** Both publish jobs in `release.yml` (npmjs.org and GitHub Packages) run `npm publish --provenance` with `id-token: write`, so a consumer can verify the tarball was built by this repository's workflow.
- **Signed release assets.** `create-assets` builds the tarball and documentation archive and writes `checksums.txt` with SHA-256. A separate `sign-and-publish-assets` job, the only one allowed to mint an OIDC token for signing, signs each asset with keyless `cosign sign-blob` and uploads the `.sig` and `.pem` files beside it.

How a release is cut and how to verify its assets is covered in [RELEASE.md](RELEASE.md).

---

## 4. Local credentials

`npm run token:create` runs `scripts/create-token.ts`, which performs the EVE SSO PKCE flow against a local callback on `http://localhost:3000/sso_callback` and writes the resulting tokens to `.env`. `npm run token:refresh` renews them.

- `.env` and `.env.test` are git-ignored. `.env.example` is the only environment file in git and holds no values.
- Credentials never appear in committed fixtures, snapshots or examples. Tests that need a real token read it from `.env` and are gated behind `ESI_GATED_TESTS` (see [TESTING.md](TESTING.md)).
- If a token is committed by mistake, revoke it in the EVE developer portal first; rewriting history does not un-leak it.

---

## 5. Planned controls

Both are registered as gaps in the charter and tracked as bead `esi-wze` ([#270](https://github.com/lgriffin/ESI.ts/issues/270)).

### SBOM (SEC-06)

Provenance says who built the package; an SBOM says what is inside it. The planned change adds `npm sbom --sbom-format cyclonedx` to the `create-assets` job, includes the SBOM in `checksums.txt`, and signs it in `sign-and-publish-assets` alongside the tarball, so it ships as a signed release asset.

### CODEOWNERS and admin enforcement (SEC-07)

Scorecard's code-review check looks for both. The planned change adds `.github/CODEOWNERS` assigning every path to the maintainer, and updates the `master` branch protection ruleset recorded in bead `esi-8we` so that it applies to administrators as well.
