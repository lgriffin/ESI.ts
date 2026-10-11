Feature: Access Lists
  The Access Lists client reads the named permission lists a character owns,
  the ones that decide who may dock at a structure, use a service, or refuel a
  sovereignty hub. A list is an identifier, a name and a description plus its
  membership: whether everyone is allowed, and the alliances, corporations and
  characters it names, each with an access level of Allowed, Blocked, Manager
  or Admin. The endpoint is character-scoped and token-gated.

  # ── List contents ───────────────────────────────────────────────────

  Rule: When an access list is requested, the Access Lists client shall return its id, name, description and membership, with one entry per listed alliance, corporation and character carrying that member's access level.
    ESI groups the membership by entity kind, so an alliance block and a
    character admin sit in separate arrays of the same record. The access
    level is per member rather than per list, which is what lets one list
    express an allow set, a deny set and its managers together.

    Scenario: List with alliance, corporation, and character members returns each access level
      Given an access list exists with characters, corporations, and alliances
      When the client requests the access list
      Then the client shall return every member with its access level

  Rule: If an access list has no members, then the Access Lists client shall return the list record with empty alliances, corporations and characters arrays.
    A list created but not yet populated still has an identifier and a name.
    Returning the record with empty membership arrays rather than a 404 keeps
    the difference between "list not created" and "list is empty" visible.

    Scenario: Empty list returns its identifier with zero-length membership arrays
      Given an empty access list exists
      When the client requests the empty access list
      Then the client shall return the list with empty membership arrays

  # ── Rejected requests ───────────────────────────────────────────────

  Rule: If ESI refuses an access list request or cannot find the list it names, then the Access Lists client shall reject the request with an EsiError.
    Access lists are private to their owner, so ESI answers a token it does not
    accept with a 401 and an unknown list identifier with a 404. Both surface
    as a typed EsiError rather than as an empty list, so a caller never
    mistakes a refusal for an unrestricted list. A client with no token at all
    never reaches ESI: it throws a NO_AUTH_TOKEN error, which is not an
    EsiError, before sending the request.

    Scenario: Expired token rejects the access list request with an EsiError
      Given ESI rejects the access token as expired
      When the client requests an access list with that token
      Then the client shall return a 401 error

    Scenario: Unknown list identifier rejects the request with an EsiError
      Given an access list does not exist
      When the client requests a non-existent access list
      Then the client shall return a 404 error for the access list
