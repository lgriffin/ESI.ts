# Security triage log

One line per closed security report, scanner finding or agent review, newest first. The disposition is one of the nine in [SECURITY-MODEL.md](SECURITY-MODEL.md#triage), and the section is the one that licenses it. `npm run security:model` fails a line whose disposition is outside that set.

| Date       | Source                             | Finding                                                                     | Disposition       | Section cited                                                    |
| ---------- | ---------------------------------- | --------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| 2026-10-10 | Security model review of `f527e88` | `X-Pages` uncapped in the async page iterators (gap 1)                      | `VALID-HARDENING` | [Rollout and open gaps](SECURITY-MODEL.md#rollout-and-open-gaps) |
| 2026-10-10 | Security model review of `f527e88` | Redirects followed with the allowlist checked on the base URL only (gap 2)  | `VALID-HARDENING` | [Rollout and open gaps](SECURITY-MODEL.md#rollout-and-open-gaps) |
| 2026-10-10 | Security model review of `f527e88` | SDE archive entry names reach adm-zip unchecked; download unbounded (gap 3) | `VALID-HARDENING` | [Rollout and open gaps](SECURITY-MODEL.md#rollout-and-open-gaps) |
