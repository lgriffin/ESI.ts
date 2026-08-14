# Nightly ESI Spec Drift Detection

## Overview

The nightly spec drift workflow automatically detects when CCP adds new endpoints to the ESI OpenAPI spec that aren't yet implemented in the codebase. It runs daily at 06:00 UTC, checks against the latest ESI compatibility date, and creates or updates a GitHub issue when gaps are found.

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Scheduled   │────▶│  check-spec-     │────▶│  GitHub Issue    │
│  06:00 UTC   │     │  drift.ts        │     │  (if gaps found) │
│  (or manual) │     │  --latest        │     │  label:spec-drift│
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │  ESI OpenAPI     │
                    │  /meta/openapi   │
                    │  ?compat=latest  │
                    └──────────────────┘
```

1. **Fetch the latest compatibility date** from `https://esi.evetech.net/meta/compatibility-dates`
2. **Download the OpenAPI spec** for that date
3. **Parse codebase endpoint definitions** from `src/core/endpoints/*Endpoints.ts`
4. **Compare** — identify endpoints in the spec but not in the codebase (missing) and vice versa (extra)
5. **File or update a GitHub issue** with the `spec-drift` label

## Issue Deduplication

- Only **one open issue** with the `spec-drift` label exists at a time
- If no open issue exists and drift is found → creates a new issue
- If an open issue already exists → adds a comment with the latest check results
- When all gaps are resolved → close the issue manually

## Running Locally

```bash
# Check against latest compatibility date (JSON output)
npx ts-node scripts/check-spec-drift.ts --latest

# Check against a specific date
npx ts-node scripts/check-spec-drift.ts --compatibility-date=2026-08-04

# Default (2025-12-16 baseline)
npx ts-node scripts/check-spec-drift.ts
```

### Output Format

```json
{
  "compatibilityDate": "2026-08-04",
  "specEndpointCount": 225,
  "codebaseEndpointCount": 208,
  "matchedCount": 198,
  "missing": [
    { "tag": "Military Campaigns", "method": "GET", "path": "/military-campaigns" }
  ],
  "extra": [
    { "method": "GET", "path": "mercenary/dens", "name": "getMercenaryDens", "file": "mercenaryEndpoints.ts" }
  ]
}
```

Exit code is `1` when missing endpoints are found, `0` otherwise.

## Workflow Trigger

The workflow runs on a cron schedule and can also be triggered manually:

- **Scheduled:** Daily at 06:00 UTC
- **Manual:** Actions tab → "Nightly ESI Spec Drift" → "Run workflow"

## Related Scripts

| Script | Purpose |
|--------|---------|
| `scripts/check-spec-drift.ts` | JSON drift report (used by CI) |
| `scripts/validate-esi-endpoints.ts` | Human-readable validation report |
| `scripts/generate-esi-types.ts` | Regenerate TypeScript types from spec |
| `scripts/snapshot-openapi.ts` | Snapshot spec for contract tests |

## ESI Compatibility Dates

CCP uses compatibility dates to version breaking changes in the ESI spec. New endpoints only appear when you request a spec with a compatibility date at or after the endpoint's introduction date. The nightly check uses `--latest` to always check against the newest date available.

Available dates can be queried at: `https://esi.evetech.net/meta/compatibility-dates`

## Responding to Drift

When the workflow files an issue:

1. Review the missing endpoints in the issue
2. Check the [ESI changelog](https://esi.evetech.net/meta/changelog) and [developer blog](https://developers.eveonline.com/blog) for context
3. Create implementation issues for each category of missing endpoints
4. Follow the implementation patterns documented in `CLAUDE.md`
5. Close the `spec-drift` issue once all gaps are addressed
