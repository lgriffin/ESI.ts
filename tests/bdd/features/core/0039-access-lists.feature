Feature: Access Lists
  The Access Lists client reads the named permission lists a character owns,
  the ones that decide who may dock at a structure, use a service, or join a
  fleet. A list is an identifier and a name plus entries, and each entry names
  a character, corporation, or alliance and states whether that entity is
  allowed or blocked. The endpoint is character-scoped and token-gated.

  # ── List contents ───────────────────────────────────────────────────

  Rule: When an access list is requested, the Access Lists client shall return its identifier, its name, and one entry per listed entity carrying the entity type and access type.
    A single list mixes entity granularities, so a character allowance and an
    alliance block sit side by side in the same entries array. The access type
    is per entry rather than per list, which is what lets one list express
    both an allow set and a deny set.

    Scenario: List mixing character, corporation, and alliance entries returns both access types
      Given an access list exists with characters, corporations, and alliances
      When the client requests the access list
      Then the client shall return all entries with their access types

  Rule: If an access list has no entries, then the Access Lists client shall return the list record with an empty entries array.
    A list created but not yet populated still has an identifier and a name.
    Returning the record with an empty array rather than a 404 keeps the
    difference between "list not created" and "list is empty" visible.

    Scenario: Empty list returns its identifier with a zero-length entries array
      Given an empty access list exists
      When the client requests the empty access list
      Then the client shall return the list with an empty entries array

  # ── Rejected requests ───────────────────────────────────────────────

  Rule: If an access list request is refused or names a list ESI cannot find, then the Access Lists client shall reject the request with an EsiError.
    Access lists are private to their owner, so an absent token produces a 401
    and an unknown list identifier produces a 404. Both surface as a typed
    EsiError rather than as an empty list, so a caller never mistakes a
    refusal for an unrestricted list.

    Scenario: Missing token rejects the access list request with an EsiError
      Given no valid token is provided
      When the client requests an access list without auth
      Then the client shall return a 401 error

    Scenario: Unknown list identifier rejects the request with an EsiError
      Given an access list does not exist
      When the client requests a non-existent access list
      Then the client shall return a 404 error
