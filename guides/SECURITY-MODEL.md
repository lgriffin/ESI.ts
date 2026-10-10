# ESI.ts Security Model

ESI.ts is a library embedded in someone else's application, so it has one trust boundary: the consumer's code and configuration are trusted, and every byte that arrives from the network is not. The library's job is to stop network data, and end-user values passed through the consumer, from choosing where a request goes, which token it carries, whose cache entry is served, or what reaches a log.

This is the scope statement for reporters, scanners, agents and the maintainer. [`SECURITY.md`](../SECURITY.md) says how to report and [`guides/SECURITY.md`](SECURITY.md) lists the controls; this document adds what both lack: who is trusted, what is claimed, what is disclaimed, and a closed set of triage outcomes. The machine-readable index of this document is [`guides/security-model.yaml`](security-model.yaml); the prose is canonical and the `security:model` audit (rollout step 3) holds the two together.

The structure is distilled from the Apache Camel security model into seven moves:

1. Name every role and give it a trust level.
2. Draw the boundary and list the untrusted inputs, including what a trusted service reports back.
3. State the claimed properties as a table, each with a severity and a test.
4. State the properties not provided, and the false friends that look like one.
5. List in-scope vulnerability classes and the out-of-scope positions.
6. Keep a list of known non-findings and a closed set of dispositions, where an unclassifiable report forces a revision of this document.
7. Publish a machine-readable index and gate it in CI, so the prose cannot drift from the code.

## Trust model

The consumer is fully trusted and ESI is trusted only to hold data: what it sends back is input.

| Role                                                                                    | Trust                                                | What follows                                                                                             |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Maintainer and release pipeline                                                         | Trusted                                              | Chooses defaults and publishes. The library relies on them for safe defaults.                            |
| Consumer developer: application code, middleware, a custom fetch, token storage, logger | Fully trusted                                        | May set `unsafeAllowCustomHost` or `validateResponse: false`. Anything consumer code does is by design.  |
| The consumer's end users, whose values the application passes as parameters             | Untrusted                                            | Their values reach `buildEndpointPath`. This is the primary attacker.                                    |
| A third party handing the application a token                                           | Untrusted                                            | Claims count only after `verifyAccessToken`, or after ESI accepts the token.                             |
| ESI and EVE SSO                                                                         | Trusted to hold data, untrusted for what they return | Bodies, `X-Pages`, cursors, ETag, Expires, redirect targets, token responses and the JWKS are all input. |
| SDE download host                                                                       | Trusted to hold data, untrusted for what it returns  | Archive entry names, YAML content and the build number are input.                                        |
| Network path attacker                                                                   | Untrusted                                            | HTTPS is enforced with no off switch.                                                                    |
| Other code in the same process                                                          | Outside the model                                    | The library is not a sandbox.                                                                            |

### Untrusted inputs and where each one enters

| Input                       | Enters at                                                                  | Must never                                                                                    |
| --------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Path and query parameters   | `validatePathParam`, `validateQueryParam` in `src/core/util/validation.ts` | Change the route or the host                                                                  |
| Response body               | Zod schemas under `src/schemas`, when `validateResponse` is on             | Be returned as a typed value it does not match                                                |
| `X-Pages` and cursor tokens | `src/core/pagination/`, `src/core/util/headersUtil.ts`                     | Drive unbounded work, or be sent anywhere but back to the same host as an encoded query value |
| ETag, Expires               | `src/core/cache/`                                                          | Serve one identity's entry to another                                                         |
| JWT claims                  | `src/auth/jwt.ts`, `src/auth/jwks.ts`                                      | Be believed before the signature or ESI's acceptance                                          |
| Redirect target             | The fetch in `src/core/requestPipeline/fetchExecution.ts`                  | Carry the token or the request off the allowlisted host                                       |
| SDE archive and build info  | `src/sde/ingestion/`                                                       | Write outside the directory the caller named                                                  |
| URLs and error text         | `sanitizeUrl`, `src/core/logger/redactLog.ts`                              | Put a credential in a log line or an error                                                    |

### Adversary

The attacker controls parameter values, any token they hand over, and whatever ESI, SSO or the SDE host can be made to return. The attacker does not have code execution in the consumer's process, the consumer's configuration, its token storage or its filesystem. A report that needs one of those is out of model.

## Security properties claimed

Twelve properties are claimed for the default configuration. A property the index marks `status: gap` is claimed but not yet held: its gap is recorded under [Rollout and open gaps](#rollout-and-open-gaps) with an issue and an expiry date, and a report that reaches it is triaged against that gap. Severity is the tier a violation starts at, not a score.

| ID  | Property                                                                                                                                               | A violation looks like                                                         | Severity | Verified by                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| P1  | A token goes only to the allowlisted HTTPS host, and only on endpoints whose definition sets `requiresAuth`                                            | An Authorization header on a public endpoint or on another host                | Critical | `tests/tdd/core/security.test.ts`, `npm run validate:auth-scopes`                                            |
| P2  | An untrusted parameter cannot change the route or the host                                                                                             | `..`, `?`, `#` or `@` in a parameter reaching a different ESI route            | High     | `security.test.ts`, `tests/fuzz/parameter-fuzz.test.ts`, feature `0059-path-parameters`                      |
| P3  | A token never appears in a log line, an error, a URL or a cache key                                                                                    | A bearer token or refresh token in output a user would paste into a bug report | High     | CHARTER SEC-02 evidence, `tests/tdd/core/redactLog.test.ts`, feature `0058-logging`                          |
| P4  | One identity is never served another's cached body or ETag, and an unverified claim grants nothing                                                     | A forged token naming a character reads that character's cache                 | Critical | `tests/tdd/core/cacheKey.test.ts`, `tests/fuzz/cache-key.property.test.ts`                                   |
| P5  | `verifyAccessToken` accepts a token only with an RS256 signature from EVE SSO's key set, the right issuer and audience, and an unexpired `exp`         | Algorithm confusion, a missing audience check, a key from another URL          | Critical | `tests/tdd/auth/jwks.test.ts`, `tests/tdd/auth/jwt.test.ts`                                                  |
| P6  | Values a response supplies (cursor, page count, redirect target) never select a host and never carry the token off the allowlisted host                | A redirect or cursor that sends a request elsewhere                            | High     | Feature `0062-security-boundary` (`@sec-P6`)                                                                 |
| P7  | With validation on, a body that does not match its schema is an error, never a typed value                                                             | Drifted or hostile JSON returned as a typed object                             | Medium   | Feature `0053-runtime-validation`, `tests/fuzz/schema-fuzz.test.ts`                                          |
| P8  | A count reported by the remote bounds no more than 1,000 page requests, at every pagination entry point                                                | `X-Pages: 100000000` starting that many requests                               | Medium   | Feature `0062-security-boundary` (`@sec-P8`), `paginationOrchestration.test.ts`, `PaginationHandler.test.ts` |
| P9  | SDE ingestion writes only inside the directory the caller named                                                                                        | An archive entry landing outside the output directory                          | High     | Feature `0062-security-boundary` (`@sec-P9`), `tests/tdd/sde/ingestion/SdeExtractor.test.ts`                 |
| P10 | The token file is written atomically with mode `0o600`                                                                                                 | A world-readable token file, or a torn write                                   | Medium   | `tests/tdd/auth/FileTokenStorage.test.ts`                                                                    |
| P11 | The published tarball is what this repository's workflow built: provenance, cosign bundle, SBOM                                                        | A release asset with no verifiable origin                                      | High     | `release.yml`, `tests/tdd/workflows/workflow-permissions.test.ts` (SEC-03 to SEC-06)                         |
| P12 | SDE content never alters the structure of the SQL `SdeDatabaseBuilder` builds: values are bound through prepared statements and identifiers are quoted | A YAML key or value that changes a statement rather than a bound value         | High     | `tests/tdd/sde/ingestion/SdeDatabaseBuilder.test.ts`                                                         |

All twelve are claimed with zero security configuration. A violation reachable only after the consumer sets an unsafe option is out of model. P6, P8 and P9 had gaps when this document was first read against the code, and are marked `status: gap` in `guides/security-model.yaml` until their fixes land; feature `0062-security-boundary`, which they cite, lands with those fixes.

## Properties not provided

Listing what is not claimed is what makes the scope a closed set: a report that says "feature X failed to do Y" can be answered with "X was not built to do Y".

- **D1 · No sandbox for consumer code.** Middleware, interceptors, a custom fetch, a custom token storage and a custom logger see every request, response and token.
- **D2 · No availability guarantee.** The rate limiter and circuit breaker protect ESI from the client. Beyond the page cap in P8, resource use under hostile responses is the consumer's to bound.
- **D3 · No protection once an opt-out is set.** `unsafeAllowCustomHost: true` removes the host check; `validateResponse: false` removes P7.
- **D4 · No sanitisation of strings ESI returns.** Character names, mail bodies and descriptions are returned as received. Escaping them for HTML or SQL is the consumer's job.
- **D5 · No encryption at rest.** `FileTokenStorage` is plain text protected by file mode only.
- **D6 · No redaction of secrets the consumer adds.** Redaction covers a fixed list of URL query parameters, not headers or bodies a consumer builds.
- **D7 · No shield against a dependency advisory that this code does not reach.** The audit gate decides exploitability; the advisory belongs upstream.
- **D8 · No constant-time comparison.**
- **D9 · No integrity check on the SDE archive.** CCP publishes no digest for the export, so the download is trusted to hold data like ESI is; P9 bounds where its entries land, and the download is bounded in size.

### False friends

- `decodeAccessToken` decodes, it does not verify. Only `verifyAccessToken` checks a signature.
- The host allowlist is checked once, on the base URL at construction. It says nothing about where a redirect leads; P6 is held by refusing redirects in the fetch itself.
- `sanitizeUrl` is a redactor for eleven named query parameters. It is not a general secret scrubber.
- `validatePathParam` protects the route. It does not make a value safe for the consumer's own use.
- Zod validation detects drift. Passthrough keeps unknown fields, and a well-shaped value can still be false.
- `requiresAuth` is generated from the specification. A wrong flag is a token leak, which is why `validate:auth-scopes` exists.
- The Scorecard number measures pipeline hygiene. It makes no statement about runtime behaviour.

## Scope

A report is in scope when it shows the library, in its default configuration, letting an untrusted input break one of P1 to P12.

### In-scope classes

- **Token exfiltration.** A token sent to a public endpoint, another host, a redirect target, a log, an error or a cache key (P1, P3, P6).
- **Route or host injection.** A parameter, cursor or header value that changes where a request goes (P2, P6).
- **Cross-identity disclosure.** A cached body, ETag or in-flight response served under the wrong identity, including through state shared by two clients in one process (P4).
- **Verification bypass.** Any way `verifyAccessToken` accepts a token EVE SSO did not sign for this client (P5).
- **Path traversal.** An archive entry or storage path escaping its directory (P9, P10).
- **Query injection.** Untrusted SDE content altering the structure of SQL that `SdeDatabaseBuilder` builds, as opposed to its bound values (P12).
- **Insecure default.** Any of the above reachable by constructing a client and making a call, with no option set.
- **Published artefact integrity.** A release whose provenance, signature or SBOM does not verify (P11).

A guard that exists in the source but is not on the live path counts as absent. A guard applied at one entry point and not at its sibling is a gap, not a configuration difference.

### Out of scope

- Anything consumer code does: middleware, interceptors, a custom fetch, a custom storage.
- Behaviour that needs `unsafeAllowCustomHost: true` or `validateResponse: false`.
- Denial of service by volume or response size, beyond the page cap in P8.
- Vulnerabilities in ESI or EVE SSO; report those to CCP Games.
- Cross-site scripting in a consumer application that renders ESI strings unescaped.
- An advisory in a development dependency, `docs-site/` or `examples/` that never ships in the tarball.
- The local scripts under `scripts/auth/`, which use a loopback callback by design.
- Versions 7.x and 8.x, which are unsupported.

## Triage

Every report, scanner finding or agent review ends in exactly one of nine dispositions, each citing a section of this document. Closed reports are logged one line each in [`guides/security-triage-log.md`](security-triage-log.md).

| Disposition                            | Meaning                                                                                                                              | Licensed by                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `VALID`                                | An untrusted input breaks a claimed property in the default configuration. Fixed, released, published as a GitHub Security Advisory. | Security properties claimed, In-scope classes |
| `VALID-HARDENING`                      | No claimed property is broken, but the default is tightened anyway. Shipped with a changelog entry, usually no advisory.             | Maintainer discretion                         |
| `OUT-OF-MODEL: trusted-input`          | Needs control of consumer code or configuration.                                                                                     | Trust model                                   |
| `OUT-OF-MODEL: adversary-not-in-scope` | Needs a capability the adversary section excludes.                                                                                   | Adversary                                     |
| `OUT-OF-MODEL: opt-in`                 | Appears only with an unsafe option or validation turned off.                                                                         | Out of scope                                  |
| `OUT-OF-MODEL: unsupported`            | Affects only 7.x, 8.x, examples or the docs site.                                                                                    | Out of scope                                  |
| `BY-DESIGN: property-disclaimed`       | Concerns a property this document says is not provided.                                                                              | Properties not provided                       |
| `KNOWN-NON-FINDING`                    | Matches an entry in the list below.                                                                                                  | Known non-findings                            |
| `MODEL-GAP`                            | Fits none of the above. The response is a pull request against this document, not an ad hoc call.                                    | This section                                  |

An incomplete fix is a new finding with its own advisory. "Already fixed in an earlier release" is not a disposition: the question is whether the path in the new report is closed.

### Known non-findings

- **N1 · "`unsafeAllowCustomHost` allows SSRF."** A named opt-in whose name is meant to show in code review.
- **N2 · "`decodeAccessToken` does not verify the signature."** Documented. The cache counts a claim only after ESI accepts the token.
- **N3 · "The cache key uses a truncated SHA-256."** It partitions a cache; it authenticates nothing. A finding needs a demonstrated collision that crosses identities.
- **N4 · "The token script listens on `http://localhost`."** A loopback PKCE callback in a developer script.
- **N5 · "A token is stored in `.env`."** Git-ignored local state; `.env.example` holds no values.
- **N6 · "Zod passthrough accepts unknown fields."** By design, so new ESI fields do not break consumers.
- **N7 · "Dependency X has an advisory."** In scope only if X is `pino` or `zod`, or an optional SDE peer, and the vulnerable path is reachable from library code.
- **N8 · "The library does not rate-limit hostile input."** Availability is disclaimed.

This list is written to be handed to a scanner or an agent as a suppression set; `guides/security-model.yaml` carries it as `non_findings`.

## Technical implementation

The model becomes rigid through seven additions that reuse machinery the repository already has: the spec audit's fixture pattern, the audit-exception expiry rule, the charter, and `ci-success`. This document, the index and the triage log land first; the rest are planned, in the order under [Rollout and open gaps](#rollout-and-open-gaps), and until the audit lands nothing gates edits to the index.

| Add                                                                                    | What it does                                                                                                                                     |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `guides/SECURITY-MODEL.md`                                                             | This document. The prose is canonical.                                                                                                           |
| `guides/security-model.yaml`                                                           | Derived index of roles, inputs, properties, disclaimed properties, non-findings and dispositions. Read by the audit script, scanners and agents. |
| `scripts/quality/security-model-audit.ts`, run as the `security:model` script          | The gate. Negative fixtures under `tests/tdd/scripts/fixtures/security-model/`, one per rule below.                                              |
| `tests/bdd/features/core/0062-security-boundary.feature`                               | One Rule per property it holds, in the unwanted-behaviour form.                                                                                  |
| `tests/tdd/core/untrusted-input-sites.test.ts`                                         | Discovers every network call and every response-header read under `src/` and fails when one is missing from the index.                           |
| `guides/security-triage-log.md`                                                        | One line per closed report: date, source, disposition, section cited.                                                                            |
| CHARTER rows SEC-09 to SEC-12, and a `security-model` job in the needs of `ci-success` | Makes the four rules below requirements with a status.                                                                                           |

### What the audit fails on

- A property in the prose table that is missing from the index, or the reverse, or a different severity (SEC-09).
- A claimed property with no Rule tagged with its id in the feature files, no existing test file, or a gap with no issue, no expiry date, or an expired date; the count of gaps may only shrink against `master` (SEC-10).
- A Rule that claims a disclaimed property.
- A network call site or response-header read in `src/` that the index does not list (SEC-11).
- A non-finding whose cited section does not exist, or a triage-log line whose disposition is outside the closed set (SEC-12).

### For agents and scanners

`AGENTS.md` and `CLAUDE.md` carry one paragraph: review security against `guides/security-model.yaml`, treat `non_findings` as suppressions, and end every finding with a disposition from the closed set.

## Rollout and open gaps

Reading master `f527e88` (v11.2.0) against the model found three gaps. Each gets a failing scenario before its fix.

| #   | Gap                                                                                                                 | Where                                                   | Property | Handling                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `X-Pages` is read with no cap in the async iterators, while two other paths cap at 1,000                            | `src/core/pagination/AsyncPaginationIterator.ts`        | P8       | `VALID-HARDENING`: one shared bounded page count used by every path                                                                                |
| 2   | No fetch in `src/` sets a redirect option, so redirects are followed; the allowlist is checked on the base URL only | `src/core/requestPipeline/fetchExecution.ts`            | P6       | Refuse redirects. Node's fetch drops `Authorization` on a cross-origin redirect, so this is hardening: the request, not the token, would have left |
| 3   | The SDE download has no size bound, and `extractAll` hands entry names to adm-zip with a peer floor of 0.4.11       | `src/sde/ingestion/SdeDownloader.ts`, `SdeExtractor.ts` | P9       | Check every entry name against the output directory before extracting, with a hostile-archive fixture; bound the download size                     |

`SdeDatabaseBuilder` reads clean against the query-injection class (P12): values are bound through prepared statements and column names are quoted with doubled quotes.

Rollout, tracked by [#627](https://github.com/lgriffin/ESI.ts/issues/627):

1. Land this document, the index, a link from `SECURITY.md` and the agent pointer. Documentation only.
2. Fix gaps 1 to 3, each with its Rule in feature 0062.
3. Land the audit script, its fixtures and the input-site test, add `security-model` to `ci-success`, and add SEC-09 to SEC-12 to the charter as Enforced.
4. Point the nightly payload fuzz and the fault catalogue at the input registry, so every registered input has a hostile-value generator.
