# Security Guide for ESI.ts

## Security Policy

### Supported Versions

| Version | Supported |
| ------- | --------- |
| 5.x     | Yes       |
| 4.x     | No        |
| 3.x     | No        |

### Reporting a Vulnerability

If you discover a security vulnerability in ESI.ts, please report it responsibly. **Do not open a public GitHub issue for security vulnerabilities.**

- **GitHub Security Advisories (preferred):** Use the [Security Advisories](https://github.com/lgriffin/ESI.ts/security/advisories/new) feature to report privately.
- **Email:** Contact the maintainer directly via the email address listed on the [GitHub profile](https://github.com/lgriffin).

Include a clear description, steps to reproduce, potential impact, and any suggested fixes.

### Response Timeline

| Severity         | Response               |
| ---------------- | ---------------------- |
| Acknowledgment   | Within 48 hours        |
| Critical fix     | Within 7 days          |
| Non-critical fix | Next scheduled release |

## Built-in Security Measures

ESI.ts implements several layers of security protection in the request pipeline.

### Token Protection

Tokens are only attached to requests that require authentication. Public ESI endpoints never receive an `Authorization` header, even when the client is configured with an access token.

**How it works:** The `ApiRequestHandler` checks the endpoint's scope requirements before building headers. If the endpoint has no required scope, the token is omitted entirely — not sent and redacted, but never attached in the first place.

**Test coverage:** `security.test.ts` — 23 tests verifying:

- Token is not sent to public endpoints (`/status/`, `/alliances/`, etc.)
- Token is sent only to authenticated endpoints (`/characters/{id}/wallet/`)
- Token appears in the `Authorization: Bearer` header, not in query strings or URLs

### HTTPS Enforcement

All requests enforce HTTPS. The library rejects any base URL that does not use the `https://` scheme.

**Test coverage:** `security.test.ts` validates that `http://` URLs are rejected at client construction time.

### Host Allowlist (SSRF Protection)

By default, outbound requests are restricted to known EVE Online ESI endpoints:

- `esi.evetech.net`
- `login.eveonline.com`

Custom hosts require the `unsafeAllowCustomHost: true` flag, making SSRF bypass an explicit opt-in rather than a silent misconfiguration.

**Test coverage:** `security.test.ts` validates that requests to non-allowlisted hosts are rejected unless the unsafe flag is set.

### Path Parameter Injection Prevention

All path parameters are validated before URL construction. The `validatePathParam()` function rejects values containing:

- Path traversal sequences (`../`, `..\\`)
- URL-encoded traversal (`%2f`, `%2e`)
- Null bytes (`%00`)
- Characters outside the expected alphanumeric + limited punctuation set

**Test coverage:** `security.test.ts` validates that crafted path parameters (e.g., `../../etc/passwd`, `123%2f456`) are rejected.

### Query Parameter Validation

Query parameters are validated for:

- Maximum length (prevents excessively long query strings)
- Rejection of `NaN`, `Infinity`, and `null` values that could cause unexpected behavior
- Type coercion safety

**Test coverage:** `security.test.ts` validates rejection of invalid query parameter values.

### URL Sanitization in Logs

API tokens and sensitive parameters are redacted from logged URLs and error messages. If an error occurs during an authenticated request, the token value is replaced with `[REDACTED]` in any output.

## Security Test Suite

The dedicated security test file (`tests/tdd/core/security.test.ts`) contains 23 tests organized into the following categories:

| Category                 | Tests | What's Validated                                                    |
| ------------------------ | ----: | ------------------------------------------------------------------- |
| Token leakage prevention |     4 | Token not sent to public endpoints, sent only to auth endpoints     |
| HTTPS enforcement        |     2 | HTTP URLs rejected, HTTPS required                                  |
| Host allowlist           |     3 | Non-ESI hosts rejected, allowlisted hosts accepted, unsafe override |
| Path injection           |     5 | Path traversal, encoded traversal, null bytes, special characters   |
| Query parameter limits   |     4 | Length limits, NaN/Infinity rejection, null handling                |
| Input sanitization       |     5 | Combined injection attempts, header injection, type coercion        |

### Running Security Tests

```bash
# Run security tests specifically
npx jest --config jest.unit.config.cjs tests/tdd/core/security.test.ts

# Run all unit tests (includes security)
npm test
```

## Dependency Security

### Automated Scanning

- **npm audit** runs as part of `npm run check:all` and CI validation
- **Dependabot** monitors dependencies for known CVEs and creates automated PRs
- **GitHub Security Advisories** are enabled on the repository

### What Counts as a Security Issue

| Category            | Example                                                            | Report via        |
| ------------------- | ------------------------------------------------------------------ | ----------------- |
| Credential exposure | API tokens leaked in logs, URLs, or error messages                 | Security Advisory |
| Injection           | Code injection, command injection, header injection via user input | Security Advisory |
| SSRF bypass         | Circumventing host allowlist to reach unintended endpoints         | Security Advisory |
| Path traversal      | Accessing resources outside intended scope via crafted input       | Security Advisory |
| Dependency CVE      | Known CVE in a direct dependency exploitable in this context       | Security Advisory |
| General bugs        | Non-security bugs, typos, feature requests                         | GitHub Issues     |

## Scope

This policy applies to the ESI.ts library itself (`@lgriffin/esi.ts`). Vulnerabilities in the upstream EVE Online ESI API should be reported to CCP Games directly.

## Security Architecture

```
Request Pipeline Security Checks
─────────────────────────────────────────────────────

Consumer Request
       │
       ▼
┌──────────────────┐
│  HTTPS Check     │  Reject http:// base URLs
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Host Allowlist   │  Only esi.evetech.net, login.eveonline.com
└──────┬───────────┘  (unless unsafeAllowCustomHost: true)
       │
       ▼
┌──────────────────┐
│  Path Validation  │  Reject traversal, null bytes, encoded attacks
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Query Validation │  Length limits, reject NaN/Infinity/null
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Token Gating     │  Only attach token if endpoint requires auth scope
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  URL Sanitization │  Redact tokens from logs and error messages
└──────┬───────────┘
       │
       ▼
    fetch()
```
