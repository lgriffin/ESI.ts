Feature: Integration Workflows
  Real applications rarely call one ESI route. Building a character sheet, a
  trading view or a fleet roster means fanning out across several domain
  clients on one EsiClient instance and joining the results by the identifiers
  they share. This file covers those cross-client workflows: that the joins
  hold, that collections arrive whole enough to aggregate over, that one failed
  leg does not take the others down, and that independent legs run in parallel.

  Each scenario drives more than one domain client from a single EsiClient, so
  what is under test is the composition rather than any individual route.

  # ── Joining records across domain clients ───────────────────────────

  Rule: When a workflow reads related records from more than one domain client, the EsiClient shall return each record with the identifier fields that link it to the others.
    A character record carries corporation_id and alliance_id; a fleet member
    carries character_id, ship_type_id and solar_system_id. Those keys are the
    only thing making a join possible, so dropping or renaming one breaks every
    composed view even though each individual call still succeeds.

    Scenario: Character profile joins character, corporation, and alliance by identifier
      Given a character ID for profile assembly
      When the client assembles a complete profile
      Then the client shall gather all related character data

    Scenario: Fleet overview joins the boss, members, and wings of one fleet
      Given fleet commander permissions
      When the client manages fleet operations
      Then the client shall coordinate fleet activities

  # ── Aggregating returned collections ────────────────────────────────

  Rule: When a workflow aggregates over a collection returned by a domain client, the EsiClient shall return every element of that collection with its numeric fields unaltered.
    Derived figures — a bid-ask spread, a corporation's total wallet balance, a
    blueprint's remaining runs — are computed by the caller from the elements
    handed back. A dropped element or a coerced number changes the answer
    without producing an error anywhere, so these three scenarios check the
    derived totals rather than the raw payloads.

    Scenario: Market analysis derives best bid, best ask, and spread from returned orders
      Given a trading opportunity exists
      When the client performs market analysis
      Then the client shall gather comprehensive market data

    Scenario: Corporation overview sums wallet balances across two divisions
      Given a corporation director role
      When the client manages corporation overview
      Then the client shall access all corporation data

    Scenario: Manufacturing setup sums remaining runs across returned blueprints
      Given manufacturing requirements exist
      When the client sets up production
      Then the client shall coordinate all manufacturing aspects

  # ── Partial failure ─────────────────────────────────────────────────

  Rule: If one call in a concurrently issued group rejects with an EsiError, then the EsiClient shall settle the remaining calls in that group with their own results.
    ESI routes fail independently — the image server can be down while the
    character route is healthy. Failures are per call and carry no shared
    state, so a caller using Promise.allSettled keeps whatever succeeded and
    can render a partial view instead of an error page.

    Scenario: Portrait outage leaves the character and corporation lookups fulfilled
      Given some services are unavailable
      When the client performs integration workflow with partial failures
      Then the client shall handle partial failures gracefully

  # ── Parallel fan-out ────────────────────────────────────────────────

  Rule: When one lookup is awaited and the five lookups that depend on it are then issued together, the EsiClient shall complete the whole workflow within 300 milliseconds.
    The dependent legs have stubbed latencies of 100, 90, 80, 60, 50 and 40
    milliseconds. Run in parallel behind the 100 millisecond character lookup
    the workflow settles near 200 milliseconds; run one after another it would
    take about 420. The 300 millisecond bound is what separates the two, so a
    regression that serialises the fan-out fails here.

    Scenario: Profile fan-out behind the initial character lookup
      Given a complex data requirement
      When the client optimizes data gathering
      Then the client shall minimize API calls and response time
