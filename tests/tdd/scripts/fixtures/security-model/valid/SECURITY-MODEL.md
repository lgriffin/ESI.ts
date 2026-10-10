# Fixture Security Model

## Trust model

### Adversary

## Security properties claimed

| ID  | Property                  | A violation looks like | Severity | Verified by |
| --- | ------------------------- | ---------------------- | -------- | ----------- |
| P1  | A token stays on the host | A token elsewhere      | Critical | a test      |
| P2  | A page count is bounded   | Unbounded requests     | Medium   | a test      |

## Properties not provided

- **D1 · No sandbox.** Consumer code sees everything.

## Scope

### Out of scope

## Triage

| Disposition         | Meaning               | Licensed by |
| ------------------- | --------------------- | ----------- |
| `VALID`             | A property broke.     | Properties  |
| `KNOWN-NON-FINDING` | Matches a known item. | Known       |

### Known non-findings

- **N1 · "The flag allows SSRF."** A named opt-in.
