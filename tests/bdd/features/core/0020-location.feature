Feature: Location Management
  The Location client covers the three character-scoped endpoints that describe
  where a pilot is and what they are doing right now: current location, online
  status with login history, and the ship currently being flown. They are the
  most privacy-sensitive reads in ESI, which is why each carries its own scope
  and why a refusal is as much part of the contract as a success.

  The location record is shape-variable — docked and undocked characters return
  different field sets — so both states are specified separately below.

  # ── Where the character is ──────────────────────────────────────────

  Rule: When the client requests the location of a docked character, the Location client shall return the solar system identifier together with the station identifier.
    Docked is the case with the most detail available: the station ID pins the
    character to a specific dockable structure inside the system, which is what
    an asset or logistics tool needs to route against.

    Scenario: Character docked in Jita 4-4
      Given an authenticated character docked in a station
      When the client requests their location
      Then the client shall return the solar system and station information

  Rule: While a character is in space, the Location client shall return the solar system identifier with no station identifier and no structure identifier.
    Undocked, there is nothing finer-grained than the system to report, so both
    docking fields are absent rather than null or zero. Callers therefore test
    for presence to decide whether the pilot is docked, and this scenario pins
    that both fields — station and player-owned structure — stay undefined.

    Scenario: Character undocked in space
      Given an authenticated character flying in space
      When the client requests their location while in space
      Then the client shall return only the solar system with no station

  # ── Online status ───────────────────────────────────────────────────

  Rule: When the client requests the online status of a character, the Location client shall return the online flag together with the last login timestamp, the last logout timestamp, and the cumulative login count.
    The flag alone answers "are they on now"; the three history fields answer
    "when were they last around and how heavily is this character played",
    which is what corporation activity tracking is built on.

    Scenario: Online character with login history
      Given an authenticated character who is currently online
      When the client checks their online status
      Then the client shall report they are online with login timestamps

  Rule: While a character is logged out, the Location client shall report the online flag as false with a last logout timestamp later than the last login timestamp.
    For an offline character the last session has both ends recorded, so logout
    strictly follows login. That ordering is what lets a caller compute the
    duration of the last session and the length of the current absence.

    Scenario: Offline character logged out after their last login
      Given an authenticated character who is currently offline
      When the client checks their offline status
      Then the client shall report they are offline

  # ── Current ship ────────────────────────────────────────────────────

  Rule: When the client requests the current ship of a character, the Location client shall return the ship item identifier, the ship name, and the ship type identifier.
    The item ID identifies this one hull instance, the type ID identifies what
    class it is, and the name is the pilot's own label for it. All three are
    needed because two pilots in the same hull type are distinguished only by
    item ID.

    Scenario: Pilot flying a named titan
      Given an authenticated character in a ship
      When the client requests their current ship
      Then the client shall return the ship details

  # ── Concurrent retrieval ────────────────────────────────────────────

  Rule: When location, online status, and ship are requested together in one Promise.all, the Location client shall resolve each request with its own response.
    A presence panel wants all three at once and they are independent reads.
    The client keeps no per-instance request state that concurrent calls could
    corrupt, and this scenario holds that property in place.

    Scenario: Location, online status, and ship fetched in parallel
      Given an authenticated character for concurrent location fetch
      When the client fetches location, online status, and ship concurrently
      Then all three location requests shall resolve successfully

  # ── Unauthorised access ─────────────────────────────────────────────

  Rule: If a character location or online status request is answered with HTTP 403, then the Location client shall reject with an EsiError.
    Each of these endpoints has its own ESI scope, so a token good enough for
    one is not automatically good enough for another. Both refusals surface as
    the same typed rejection, letting callers branch on error class rather than
    on message text.

    Scenario: Location request without a token
      Given an unauthenticated location request
      When the client requests a character location without auth
      Then the client shall return a 403 forbidden error for location

    Scenario: Online status request without a token
      Given an unauthenticated online status request
      When the client requests online status without auth
      Then the client shall return a 403 forbidden error for online status
