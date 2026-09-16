# Review on PR #312 — "test(status): cover VIP mode"

Reviewer checklist severities: **blocker** must be fixed before merge,
**major** must be fixed or explicitly deferred to a tracked issue, **minor**
is at the author's discretion.

1. **blocker — transport-seam mocking (R3).** Both scenarios use
   `jest.spyOn(client.status, 'getStatus')`. That mocks the method under test,
   so neither scenario can fail for a bug in the Status client, the request
   pipeline, or schema validation. Queue HTTP responses with the seam helpers
   in `tests/bdd/support/` instead.

2. **major — Rule coverage (R1).** The Rule title carries two requirements
   (two `shall`s): the VIP flag and the 503 rejection. Split it into one Rule
   per requirement and nest each scenario under the Rule it verifies.

3. **major — Rule coverage (R2).** The VIP scenario only asserts `vip`; the
   Rule says the flag is reported "as a boolean", so assert the type too.

4. **minor.** "Outage during VIP window" implies a VIP precondition the
   scenario never sets up. Name the case for what it exercises.

Work is tracked as esi-7tw.
