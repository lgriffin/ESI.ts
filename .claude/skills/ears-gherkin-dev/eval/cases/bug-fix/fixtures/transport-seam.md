# Transport seam (fixture)

BDD step files in ESI.ts mock HTTP, never the client method under test.

- `fetch` is mocked globally for every BDD file by `jest-fetch-mock`.
- `tests/bdd/support/` exports the seam helpers. `queueResponse({ status, headers, body })`
  queues exactly one HTTP response; call it once per request the scenario makes,
  in order. Pipeline pre-condition helpers (cache state, circuit state, token
  state) also live there.
- `jest.spyOn(client.<domain>, '<method>')` is banned in `tests/bdd/**` by ESLint:
  it makes the scenario assert on its own fixture, so it cannot fail for a bug
  in `src/`.
- Step files import the helpers from `../../support` (relative to
  `tests/bdd/step-definitions/core/`).
- Each `test('...')` title must match its `Scenario:` name exactly.
