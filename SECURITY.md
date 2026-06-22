# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 4.x     | Yes       |
| 3.x     | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in ESI.ts, please report it responsibly. **Do not open a public GitHub issue for security vulnerabilities.**

### How to Report

- **GitHub Security Advisories (preferred):** Use the [Security Advisories](https://github.com/lgriffin/ESI.ts/security/advisories/new) feature to report privately.
- **Email:** Contact the maintainer directly via the email address listed on the [GitHub profile](https://github.com/lgriffin).

### What to Include

- A clear description of the vulnerability
- Steps to reproduce or a proof of concept
- The potential impact
- Any suggested fixes (optional)

## What Counts as a Security Issue

The following are examples of issues we consider security vulnerabilities:

- **Credential exposure** -- API tokens, client secrets, or other sensitive data leaked in logs, URLs, or error messages
- **Injection** -- code injection, command injection, or header injection via user-controlled input
- **SSRF bypass** -- circumventing host allowlist restrictions to reach unintended endpoints
- **Path traversal** -- accessing files or resources outside the intended scope via crafted input
- **Dependency vulnerabilities** -- known CVEs in direct dependencies that are exploitable in this context

Issues that are not security vulnerabilities (e.g., typos, feature requests, general bugs) should be reported via [GitHub Issues](https://github.com/lgriffin/ESI.ts/issues).

## Response Timeline

- **Acknowledgment:** Within 48 hours of receiving the report.
- **Assessment:** We will evaluate severity and impact promptly after acknowledgment.
- **Fix (critical):** Within 7 days for critical vulnerabilities.
- **Fix (non-critical):** Addressed in the next scheduled release.

We will coordinate disclosure with the reporter and credit them in the release notes unless they prefer to remain anonymous.

## Existing Security Measures

ESI.ts already implements the following protections:

- **URL sanitization** -- API tokens and sensitive parameters are redacted from logged URLs and error messages.
- **SSRF protection** -- A host allowlist restricts outbound requests to known EVE Online ESI endpoints.
- **Input validation** -- Path parameters are validated to prevent path traversal and injection attacks.

## Scope

This policy applies to the ESI.ts library itself (`@lgriffin/esi.ts`). Vulnerabilities in the upstream EVE Online ESI API should be reported to CCP Games directly.
