Feature: Asset Management
  The Assets client covers the character and corporation inventory endpoints of
  ESI, plus the two POST lookups that resolve a batch of item IDs to the names
  their owner gave them and to their coordinates in space. An asset listing
  carries no names and no positions of its own, so auditing a hangar always
  means the listing call followed by the two batch lookups.

  # ── Asset listings ──────────────────────────────────────────────────

  Rule: When character assets are requested for a character ID, the Assets client shall return an array whose entries each carry item_id, type_id, quantity, location_id, location_flag, and location_type.
    An asset row is only interpretable with all six fields: the type says what
    it is, the quantity how much, and the location triple says where it sits
    and in which container slot. Missing any one of them forces the caller
    into a second lookup.

    Scenario: Asset listing for a character holding two stacks
      Given a valid character ID with assets
      When the client requests character assets
      Then the client shall return a list of assets

  Rule: If a character holds no assets, then the Assets client shall return an empty array.
    A character with an empty hangar is an ordinary state, not an error.
    Returning an empty array rather than null keeps the call site free of a
    special case before iterating.

    Scenario: Character holding an empty hangar
      Given a character with no assets
      When the client requests character assets for the empty inventory
      Then the client shall return an empty array

  Rule: When corporation assets are requested for a corporation ID, the Assets client shall return an array of asset entries carrying the corporate hangar division in location_flag.
    Corporation holdings are split across hangar divisions, and the division
    is only visible in location_flag. That field is what lets a caller
    attribute stock to the division that owns it.

    Scenario: Asset listing for a corporation hangar division
      Given a valid corporation ID with assets
      When the client requests corporation assets
      Then the client shall return the corporation asset list

  Rule: When character assets and corporation assets are requested concurrently, the Assets client shall resolve each call with the listing belonging to its own owner.
    The two listings share an entry shape but not a scope. Awaiting them
    together is the normal way to build a combined stock view, so neither call
    may answer the other.

    Scenario: Character listing and corporation listing fetched at once
      Given a character and their corporation
      When the client fetches both asset sets concurrently
      Then the client shall return both results independently

  # ── Batch lookups ───────────────────────────────────────────────────

  Rule: When asset names are requested for a list of item IDs, the Assets client shall return one entry per item ID carrying that item_id and its name.
    Player-assigned names live behind a separate POST endpoint because they
    exist only for named items. Pairing each name back to its item_id is what
    lets the caller merge the result into the listing it already holds.

    Scenario: Name lookup for two named items
      Given a character with named assets
      When the client requests asset names by item IDs
      Then the client shall return the names for those assets

  Rule: When asset locations are requested for a list of item IDs, the Assets client shall return one entry per item ID carrying that item_id and its position.
    Coordinates apply to items in space rather than in a station hangar, so
    they are a separate batch call. The item_id on each entry is again the
    join key back to the listing.

    Scenario: Position lookup for one item in space
      Given a character with located assets
      When the client requests asset locations by item IDs
      Then the client shall return position data

  Rule: When an asset listing is followed by name and location lookups for the item IDs it returned, the Assets client shall resolve every call in the sequence.
    This is the full audit path a stock-tracking application runs: list, then
    enrich. The item IDs feeding the two batch calls come from the listing
    response itself, so the sequence is ordered rather than a plain fan-out.

    Scenario: Listing feeding name and location lookups for its own item IDs
      Given a character with assets for audit
      When the client retrieves assets then look up their names and locations
      Then the client shall have a complete asset inventory

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If an asset request is rejected for lack of authorization, then the Assets client shall reject with an EsiError.
    Asset endpoints are token-scoped, and tokens expire mid-session. Surfacing
    the refusal as the domain error type puts it on the same handling path as
    any other failure rather than as a silent empty listing.

    Scenario: Expired token on the character assets endpoint rejects the request
      Given an invalid or expired token for assets
      When the client requests character assets without authorization
      Then the client shall return a 403 forbidden error
