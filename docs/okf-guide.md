# Open Knowledge Format (OKF) for ESI

This project generates an [OKF v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf) knowledge bundle that catalogs every endpoint and response schema in the EVE Swagger Interface (ESI) API.

## What is OKF?

OKF is an open, vendor-neutral specification for representing knowledge as **plain markdown files with YAML frontmatter** in a directory hierarchy. Created by Google Cloud, it formalizes a pattern for making organizational knowledge consumable by both humans and AI agents.

Key properties:

- **No SDK required** -- standard markdown with YAML frontmatter, readable by any tool (Obsidian, MkDocs, GitHub, LLMs).
- **Provenance built in** -- every concept records who generated it, when, and from what source.
- **Trust tiers** -- `generated`, `verified`, and `status` fields let consumers assess trustworthiness without runtime logic.
- **Graph structure** -- directory hierarchy provides taxonomy; markdown cross-links create a richer relationship graph.
- **Progressive disclosure** -- `index.md` files at each level let agents navigate one layer at a time instead of loading everything.

## Bundle structure

```
okf/
  index.md                              # Bundle root (okf_version: "0.2")
  log.md                                # Generation changelog
  domains/
    index.md                            # Lists all 33 API domains
    alliance/
      index.md                          # Lists endpoints in this domain
      get-alliances.md                  # One concept per endpoint
      get-alliances-alliance-id.md
      ...
    market/
      index.md
      get-markets-region-id-orders.md
      ...
    ...  (33 domain directories)
  schemas/
    index.md                            # Lists all response schemas by domain
    alliance-detail.md                  # One concept per response data model
    markets-region-id-orders-get.md
    ...  (161 schema concepts)
```

## Concept types

### ESI Endpoint

Each endpoint concept captures the full operational profile:

```yaml
---
type: ESI Endpoint
title: Get Markets Region ID Orders
description: List orders in a region
resource: "https://esi.evetech.net/ui/#/Market/GetMarketsRegionIdOrders"
tags: [market, public, paginated]
generated:
  by: process:generate-okf
  at: 2026-08-05T08:51:36Z
status: stable
sources:
  - id: esi-openapi
    resource: "https://esi.evetech.net/meta/openapi.json"
    title: ESI OpenAPI Specification
---
```

The body includes:

| Section | Contents |
|---------|----------|
| **Endpoint** | HTTP method, path, auth requirement, cache TTL, rate limit group and budget |
| **Scopes** | Required OAuth2 scopes (when authenticated) |
| **Parameters** | Path and query parameters with types and descriptions |
| **Response** | Link to the response schema concept, noting if it returns an array |

### ESI Response Schema

Each schema concept documents the fields of a response object:

```yaml
---
type: ESI Response Schema
title: Alliance Detail
description: Public information about an alliance
tags: [alliance, schema]
generated:
  by: process:generate-okf
  at: 2026-08-05T08:51:36Z
status: stable
sources:
  - id: esi-openapi
    resource: "https://esi.evetech.net/meta/openapi.json"
    title: ESI OpenAPI Specification
---
```

The body contains a **Schema** table (field name, type, required, description) and a **Used By** section linking back to every endpoint that returns this schema.

## How to use the bundle

### With an LLM or AI agent

Load concept files directly into context. Start with `okf/index.md` for an overview, drill into a domain via `okf/domains/<domain>/index.md`, then read individual endpoint concepts. The progressive disclosure pattern keeps token usage efficient.

### As browsable documentation

The bundle is valid markdown -- open it in any markdown viewer:

- **GitHub** renders it natively when committed to a repository.
- **Obsidian** treats it as a vault with working cross-links.
- **MkDocs / Hugo / Jekyll** can serve it as a static site.

### For programmatic consumption

Parse YAML frontmatter from any concept file to extract structured metadata. The `type` field distinguishes endpoint concepts from schema concepts. Tags, scopes, and rate limit data are all available as structured YAML.

## Regenerating the bundle

```bash
npm run generate:okf
```

This fetches the live ESI OpenAPI spec from `https://esi.evetech.net/meta/openapi.json` and regenerates the entire `okf/` directory. The previous bundle is replaced on each run.

The generator script is `scripts/generate-okf.ts`. It extracts:

- Endpoint paths, methods, and descriptions
- Authentication requirements and OAuth2 scopes
- Cache TTLs (`x-cache-age` extension)
- Rate limit groups and budgets (`x-rate-limit` extension)
- Path and query parameters (header parameters are filtered out)
- Response schemas with field-level metadata

## OKF specification reference

The bundle conforms to [OKF v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md). Key conformance rules:

1. Every non-reserved `.md` file has parseable YAML frontmatter with a non-empty `type` field.
2. Reserved filenames (`index.md`, `log.md`) follow the spec-defined structure.
3. Cross-links use bundle-relative paths (starting with `/`).
4. Unknown frontmatter keys are preserved (the spec requires consumers to tolerate them).

For the full specification, see the [OKF SPEC.md](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) and the [Google Cloud blog post](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) introducing the format.
