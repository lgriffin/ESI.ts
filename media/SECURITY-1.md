# Security Policy

This is the vulnerability disclosure policy for `@lgriffin/esi.ts`. The controls the library and its build pipeline apply are described in [guides/SECURITY.md](guides/SECURITY.md).

## Supported versions

| Version | Supported |
| ------- | --------- |
| 9.x     | Yes       |
| 8.x     | No        |
| 7.x     | No        |

The support window is described in [guides/RELEASE.md](guides/RELEASE.md).

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

- **GitHub Security Advisories (preferred):** report privately through [Security Advisories](https://github.com/lgriffin/ESI.ts/security/advisories/new).
- **Email:** contact the maintainer at the address listed on the [GitHub profile](https://github.com/lgriffin).

Include:

- a clear description of the vulnerability
- steps to reproduce or a proof of concept
- the potential impact
- a suggested fix, if you have one

## Response timeline

| Stage            | Target                                     |
| ---------------- | ------------------------------------------ |
| Acknowledgement  | Within 48 hours of the report              |
| Assessment       | Severity and impact, after acknowledgement |
| Critical fix     | Within 7 days                              |
| Non-critical fix | Next scheduled release                     |

Disclosure is coordinated with the reporter. Reporters are credited in the release notes unless they ask to remain anonymous.

## What counts as a security issue

| Category            | Example                                                                                |
| ------------------- | -------------------------------------------------------------------------------------- |
| Credential exposure | Access tokens, refresh tokens or client secrets leaked in logs, URLs or error messages |
| Injection           | Code, command or header injection through caller-supplied input                        |
| SSRF bypass         | Reaching a host other than ESI without setting `unsafeAllowCustomHost`                 |
| Path traversal      | Escaping the intended ESI route through a crafted path parameter                       |
| Dependency CVE      | A known advisory in a runtime dependency that is exploitable in this context           |

Typos, feature requests and ordinary bugs belong in [GitHub Issues](https://github.com/lgriffin/ESI.ts/issues).

## Scope

This policy covers the ESI.ts library and its release artefacts. Vulnerabilities in the EVE Online ESI API or EVE SSO themselves should be reported to CCP Games.
