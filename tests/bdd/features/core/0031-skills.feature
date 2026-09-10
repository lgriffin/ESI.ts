Feature: Character Skills
  The Skills client covers the three authenticated character skill endpoints:
  the trained skill list with its total and unallocated skill points, the
  ordered training queue, and the five neural attributes with their remap
  allowance. All three are character-scoped and token-gated, so the client has
  to surface both the payload shape and the authorisation failure that comes
  back when the token no longer grants the scope.

  # ── Trained skills ──────────────────────────────────────────────────

  Rule: When character skills are requested, the Skills client shall return the trained skill entries together with the total and unallocated skill point counts.
    A skill list is only meaningful alongside its totals: the per-skill entries
    give trained level and skillpoints in skill, while total_sp and
    unallocated_sp describe the character as a whole. Both a two-skill starter
    character and an eighty-million-SP veteran are exercised, because the
    payload shape does not change with size.

    Scenario: Two-skill character returns per-skill levels and total SP
      Given a valid character ID for skills
      When the client requests character skills
      Then the client shall return the skills list with total SP

    Scenario: Veteran character returns every skill entry and unallocated SP
      Given a veteran character
      When the client requests their skills
      Then the client shall return a large skill set with high total SP

  # ── Training queue ──────────────────────────────────────────────────

  Rule: When the character skill queue is requested, the Skills client shall return an array of queue entries in ascending queue position order.
    ESI returns the queue already ordered by queue_position, and callers rely
    on that ordering to render "training now" versus "next up". An idle
    character has no queue at all, which the endpoint expresses as an empty
    array rather than an error or a null body.

    Scenario: Three queued skills keep ascending queue positions
      Given a character with skills in training
      When the client requests the skill queue
      Then the client shall return an ordered queue

    Scenario: Idle character returns an empty queue array
      Given a character with no skills in training
      When the client requests the skill queue for idle character
      Then the client shall return an empty queue array

  # ── Neural attributes ───────────────────────────────────────────────

  Rule: When character attributes are requested, the Skills client shall return the intelligence, memory, perception, willpower, and charisma values along with the remaining bonus remap count.
    Training speed is a function of two attributes per skill, so all five
    values are needed to compute it, and bonus_remaps tells the caller how many
    further reallocations the character still has. A default spread and a
    perception-weighted remap are both covered to show the values track
    whatever the character last chose.

    Scenario: Default attribute spread returns all five values and remaps
      Given a valid character ID for attributes
      When the client requests attributes
      Then the client shall return all five attributes and remap info

    Scenario: Perception-weighted remap returns the reallocated values
      Given a character with a perception-focused remap
      When the client requests remapped attributes
      Then the client shall report elevated perception

  # ── Authorisation and concurrency ───────────────────────────────────

  Rule: If the access token does not grant the skills scope, then the Skills client shall reject the request with an EsiError.
    Every skills endpoint is authenticated. A missing or expired token produces
    a 403 from ESI, and the client converts that into a typed EsiError rather
    than a bare response object so callers can branch on the error class.

    Scenario: Expired token rejects the skills request with an EsiError
      Given an invalid or expired token
      When the client requests skills without authorization
      Then the client shall return a 403 skills error

  Rule: The Skills client shall return the skills, queue, and attributes payloads independently when all three are requested concurrently.
    A character sheet view fetches all three at once. The client holds no
    per-instance request state, so three in-flight calls resolve to their own
    payloads without interfering with each other.

    Scenario: Concurrent skills, queue, and attributes calls each resolve independently
      Given a valid character for concurrent fetch
      When the client fetches skills, queue, and attributes concurrently
      Then all three shall return valid data
