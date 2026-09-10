Feature: Search Management
  The Search client wraps ESI's character-scoped search: a query string plus a
  list of categories to search in, answered with the IDs that matched. It is
  the standard way to turn a name a player typed into the numeric ID every
  other endpoint expects.

  The response is an object keyed by category rather than a flat list, and only
  the categories that matched appear in it, so the shape of the result varies
  with the query.

  # ── Searching ───────────────────────────────────────────────────────

  Rule: When a character-scoped search is performed, the Search client shall return the matched IDs grouped under the key of the category each match belongs to.
    One query can hit several categories at once — "Jita" is a system, a set
    of stations, and a character name — so results are grouped rather than
    merged. Keying by category is what lets a caller take the IDs it can use
    and ignore the rest without a second lookup to work out what each ID is.

    Scenario: Character name query returns three character IDs
      Given a valid character ID and search string
      When the client searches for characters
      Then the client shall return matching character results

    Scenario: Jita query returns systems, stations, characters, and corporations
      Given a broad search query
      When the client searches across categories
      Then the client shall return results in multiple categories

    Scenario: Amarr query returns three solar system IDs
      Given a search for a solar system name
      When the client searches for solar systems
      Then the client shall return matching system IDs

    Scenario: Goonswarm query returns one alliance ID
      Given a search for an alliance name
      When the client searches for alliances
      Then the client shall return matching alliance IDs

  Rule: When a search is performed with a two-character query string, the Search client shall return the matches ESI reports for that query.
    Short prefixes are what an autocomplete field sends on the second
    keystroke. The client imposes no minimum length of its own, so a
    two-character query reaches ESI and its matches come back like any other.

    Scenario: Two-character query returns system and character matches
      Given a very short search string
      When the client searches with a short query
      Then I shall still receive valid results

  # ── No matches ──────────────────────────────────────────────────────

  Rule: If a search matches nothing in a category, then the Search client shall omit that category key from the result.
    ESI reports an unmatched category by leaving it out rather than sending an
    empty array, and the client passes that through. A caller therefore reads
    an absent key as "no matches" and has to guard each category before
    iterating it.

    Scenario: Query matching nothing returns an object with no category keys
      Given a search query with no matches
      When the client searches for nonexistent items
      Then the client shall return undefined or empty category arrays

  # ── Error propagation ───────────────────────────────────────────────

  Rule: If the ESI API rejects a search request with an error status, then the Search client shall raise an EsiError.
    Search is authenticated and requires its own scope, so a token missing
    that scope is the common failure. It surfaces as the standard error type
    rather than as an empty result set, which a caller could otherwise read
    as a query that simply matched nothing.

    Scenario: Search without the search scope is rejected with 403
      Given insufficient search permissions
      When the client searches without permissions
      Then the client shall return a 403 search error
