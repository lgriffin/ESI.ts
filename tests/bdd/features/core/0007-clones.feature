Feature: Clone Management
  The Clones client covers the two token-scoped endpoints describing where a
  character can wake up and what is plugged into their head: the clone record,
  which holds the home station and the jump clones with the implants installed
  in each, and the implant endpoint, which lists the implants active in the
  body the character is flying right now. The two are separate reads because
  they answer different questions, and a caller assembling a clone sheet needs
  both.

  # ── Clone records ───────────────────────────────────────────────────

  Rule: When clone information is requested for a character ID, the Clones client shall return a record carrying the home location and one entry per jump clone.
    The home location is where a pod death returns the character, and the jump
    clone entries are the alternative bodies they can jump to. Both are needed
    before a caller can show where a character is able to end up.

    Scenario: Clone record with a home station and two jump clones
      Given a valid character ID for clones
      When the client requests clone information
      Then the client shall return clone details

  # ── Implants ────────────────────────────────────────────────────────

  Rule: When implants are requested for a character ID, the Clones client shall return an array of numeric implant type IDs.
    The endpoint returns bare type IDs rather than objects, so a caller wanting
    names or attribute bonuses joins them against the universe or dogma
    domain. Stating the element type here is what makes that join safe to
    write.

    Scenario: Implant list for a character wearing five implants
      Given a valid character ID for implants
      When the client requests implant information
      Then the client shall return a list of implant type IDs

  Rule: If a character has no active implants, then the Clones client shall return an empty array.
    An empty head is an ordinary state — a character who has just been podded
    has no implants at all. Returning an empty array rather than null keeps
    the call site free of a special case.

    Scenario: Character wearing no implants
      Given a character with no active implants
      When the client requests implant information for the character
      Then the client shall return an empty array for implants

  Rule: When clone information and implants are both requested for a character ID, the Clones client shall return the implants stored on each jump clone separately from the implants active in the current body.
    These are two distinct sets and confusing them misstates what a character
    is actually flying with. The clone record lists what sits waiting in each
    stored body; the implant endpoint lists what is plugged in now.

    Scenario: Jump clone implants read alongside the active implant set
      Given a character with clones
      When the client retrieves clone info and implants
      Then the client shall have complete clone data

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If a clone request is rejected, then the Clones client shall reject with an error whose message carries the reason reported by ESI.
    Clone endpoints are token-scoped and tokens expire mid-session. Preserving
    the server's own wording is what lets a caller tell an expired token from
    a missing scope without inspecting the status code.

    Scenario: Expired token rejects with the reason reported by ESI
      Given an invalid access token for clones
      When the client requests clone information without authorization
      Then the client shall return an authentication error for clones
