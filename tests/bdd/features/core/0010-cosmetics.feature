Feature: Cosmetics SKINR
  The Cosmetics client covers the SKINR endpoints, which describe ship paint
  rather than ship capability: the designs a character holds a licence for, the
  components — patterns, nanocoatings and the like — they can build designs
  from, and the public record of one design's appearance. Licences and
  components are token-scoped to a character; a design record is public and is
  keyed by a string ID rather than a numeric one.

  # ── Character holdings ──────────────────────────────────────────────

  Rule: When character SKINR licences are requested for a character ID, the Cosmetics client shall return a record whose licenses array holds one entry per owned design carrying skinr_id, activated, and unactivated.
    A licence entry says which design it covers and how many uses of it the
    character has left — activated marks the design as already applied, and
    unactivated counts the copies still in hand. The array sits inside an
    enveloping record rather than being returned bare.

    Scenario: Licence list holding an activated design and an unactivated one
      Given the character owns SKINR licenses
      When the client requests character SKINR
      Then the client shall return the license data

  Rule: If a character owns no SKINR licences, then the Cosmetics client shall return a record whose licenses array is empty.
    Owning no designs is the starting state for every character. The envelope
    is still present with an empty array inside, so a caller reads the same
    path whether or not anything is owned.

    Scenario: Character owning no SKINR licences
      Given the character has no SKINR licenses
      When the client requests character SKINR
      Then the client shall return an empty license list

  Rule: When SKINR components are requested for a character ID, the Cosmetics client shall return a record whose licenses array holds one entry per component carrying component_id, type, and runs.
    Components are the ingredients a design is assembled from, and the runs
    field says how many applications are left — either a remaining count or an
    unlimited marker. The type names which kind of ingredient the entry is.

    Scenario: Component list holding a limited-run nanocoating and an unlimited pattern
      Given the character owns SKINR components
      When the client requests SKINR components
      Then the client shall return component data with types

  # ── Public design records ───────────────────────────────────────────

  Rule: When a SKINR design is requested by design ID, the Cosmetics client shall return a record carrying id, name, tier, and layout.
    The design record is public, so a caller can render someone else's ship
    without holding a licence for it. The layout holds the slots and the blend
    mode that decide how the design is drawn, and the tier ranks it.

    Scenario: Public design record with tier level and layout slots
      Given a public SKINR design exists
      When the client requests SKINR attributes
      Then the client shall return the design layout and tier

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If a cosmetics request fails, then the Cosmetics client shall reject with an EsiError.
    SKINR is a newer part of the API and its endpoints go out of service
    independently of the rest. Surfacing the outage as the domain error type
    keeps it on the same handling path as any other failure rather than as an
    empty licence list.

    Scenario: Service outage rejects the request
      Given the ESI service is down
      When the client requests cosmetics data
      Then the client shall return a 503 error
