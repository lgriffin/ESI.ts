# tests/contract — agent notes

This directory checks the client against ESI itself. It holds two tiers that
check two different truths, and they must stay separate.

| Truth                                          | Tier                                           | Runs                           | Network |
| ---------------------------------------------- | ---------------------------------------------- | ------------------------------ | ------- |
| The **spec**: endpoint definitions vs OpenAPI  | `esi-contract.test.ts`, `esi-snapshot.test.ts` | `npm run contract:live` (CI)   | yes     |
| The **payloads**: what ESI sends vs the client | `replay/`, fixtures in `fixtures/recorded/`    | `npm run contract:replay` (CI) | no      |
| Payload drift since the fixtures were recorded | `record.ts` + `shape-diff.ts`                  | nightly-recorded-payloads.yml  | yes     |

Generated types drifting from the spec belong to `nightly-spec-drift.yml`, not
here.

## Recorded payload replay (bead esi-23g.9)

**Scope.** One recorded, sanitised response per public (unauthenticated) GET
endpoint definition, captured from live ESI with the client's own
`User-Agent` and `X-Compatibility-Date`. Each replay calls the real public
client method through the BDD transport seam
(`tests/bdd/support/transport.ts`) and checks:

1. the endpoint's Zod schema accepts the body ESI sent;
2. the returned value has the same key paths as the recording, and a field
   added to it survives validation (`z.looseObject`);
3. offset pagination costs one request per recorded page (`X-Pages`);
4. inside the operation's recorded `x-cache-age` the second call is served
   from the cache, and after it the client revalidates with `If-None-Match`
   set to the recorded ETag (without an ETag it just requests again).

**Signal.** The tier has been seen to fail:

- `fixtures/recorded-negative/status.getStatus.json` is a real recording with
  `players` edited to a string; `replay/negative-fixture.test.ts` asserts the
  replay rejects it with `EsiValidationError` naming `players`.
- `replay/harness.test.ts` shows the coverage check, the shrink-only ratchet
  (including failing closed with no base ref), truncation and the shape diff
  each reporting a crafted fault.
- Mutants run against the 79 replays when the tier was built, each failing
  with a message naming the check: no `If-None-Match` header (70 failed),
  `z.looseObject` → `z.object` in `src/schemas/` (57), offset pagination
  skipped for two pages (5, every paginated fixture), the spec TTL doubled
  (30).

**Lists that only shrink** (checked against `origin/master`, or
`CONTRACT_BASE_REF`; with neither readable the check fails):

- `fixtures/unrecordable.json` — public endpoints that cannot be recorded,
  each with the reason. The recorder removes an entry when it records the
  endpoint. A new public endpoint must be recordable.
- `fixtures/known-mismatches.json` — endpoints whose replay fails today
  (a schema that rejects ESI's body, a cache TTL not applied). Their replay
  must keep failing; once it passes, the entry must go.

**Budget.** `recorded/policy.ts`: at most 24 KiB per fixture and 256 KiB for
all fixtures; arrays keep 3 elements plus any that add an unseen key path (8
at most), maps over 60 keys keep 4, strings over 400 characters are cut,
paginated endpoints keep 2 pages. Every cut is listed in the fixture's
`truncated`, and `upstreamPages` keeps the page count ESI reported.

## Working here

- Record (network): `ESI_LIVE_TESTS=true npm run contract:record`, or
  `-- --only=market.getMarketOrders` for one endpoint. Refuses to run without
  `ESI_LIVE_TESTS=true`. Stops on a 420 and never retries it.
- Replay: `npm run contract:replay`, one endpoint with `-- -t "<key>"`.
- A new public GET endpoint needs a recipe in `recorded/catalogue.ts`
  (client, public method, arguments from `SEEDS` or a derived ID) and a
  recording. The coverage test names the command.
- A replay that fails because the schema rejects ESI's body is the bug this
  tier exists for: fix the schema in its own `fix(schemas):` commit per
  `guides/SEMVER.md`. Only when the fix is breaking and not yet approved does
  it go in `known-mismatches.json`, with the reason.

## What does not belong here

- Hand-written or edited bodies passed off as recordings. Synthetic bodies
  live in `tests/bdd/` or `tests/tdd/`; the one edited fixture lives in
  `fixtures/recorded-negative/` and says so.
- Authenticated endpoints, tokens, or anything tied to a player account beyond
  what public endpoints already expose.
- Snapshot assertions on response bodies. Fixtures are inputs; the replay
  asserts behaviour.
- Mocks above the transport seam (`spyOn` on a client, `handleRequest` or
  `createClient`).
- Tests that need the network in `replay/`. The live tier is
  `jest.contract.live.config.cjs`; `jest.contract.config.cjs` ignores
  `replay/`.
