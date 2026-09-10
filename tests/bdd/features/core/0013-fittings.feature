Feature: Fittings Management
  A fitting is a saved ship loadout belonging to one character: a hull type, a
  name and description, and a list of modules pinned to slot flags. The
  Fittings client covers the three operations ESI offers over them — list,
  create and delete. There is no update endpoint; changing a fitting means
  deleting it and saving a new one.

  Every endpoint here is authenticated and character-scoped, so an absent or
  wrong-scope token is a specified outcome rather than an edge case.

  # ── Reading saved fittings ──────────────────────────────────────────

  Rule: When the client requests the fittings of a character, the Fittings client shall return one entry per saved fitting carrying fitting_id, name, ship_type_id, and an item list of type_id, flag, and quantity triples.
    The slot flag is what makes the item list meaningful — the same module type
    fitted high or mid is a different loadout — so the flag travels with every
    item rather than being implied by list position. fitting_id is the handle
    used for the delete call.

    Scenario: Two saved fittings expand to full module lists
      Given a character with saved fittings
      When the client requests their fittings
      Then the client shall return an array of fitting details

  Rule: While a character has no saved fittings, the Fittings client shall return an empty array.
    An empty hangar of loadouts is an ordinary state, not an error, so it comes
    back as a zero-length array rather than a 404 or a null. Callers can
    iterate the result unconditionally.

    Scenario: Character who has saved no fittings
      Given a character with no saved fittings
      When the client requests their fittings list
      Then the client shall return an empty array

  # ── Creating fittings ───────────────────────────────────────────────

  Rule: When the client saves a fitting, the Fittings client shall return the fitting_id assigned by the server.
    The server owns identifier allocation, so the created ID is the only part
    of the response that the caller cannot already predict — and it is what the
    subsequent delete call needs. Loadout size does not change the contract:
    the two scenarios save a three-module fit and an eight-module fit and both
    get back nothing but the new ID.

    Scenario: New fitting returns the assigned ID
      Given valid fitting data
      When the client creates a new fitting
      Then the client shall return the new fitting ID

    Scenario: Fully fitted battleship returns the assigned ID
      Given a fully fitted ship
      When the client saves the fitting
      Then the fitting shall be created with all module slots populated

  # ── Deleting fittings ───────────────────────────────────────────────

  Rule: When the client deletes a fitting, the Fittings client shall resolve with no response body.
    ESI answers a successful delete with 204 No Content. The client surfaces
    that as an undefined resolution rather than inventing a status object, so
    the absence of a rejection is the success signal.

    Scenario: Deleting a fitting resolves with no body
      Given a valid fitting ID
      When the client deletes the fitting
      Then the operation shall complete without error

  # ── Sequenced operations ────────────────────────────────────────────

  Rule: When a create, list, and delete sequence is run against one character, the Fittings client shall forward the character ID to each call and the created fitting ID to the delete call.
    Fittings are addressed by a character and fitting ID pair, and the fitting
    ID only exists once the create call has returned. This scenario checks the
    handles are threaded through the sequence rather than defaulted or dropped.

    Scenario: Create, list, then delete for one character
      Given a character for fitting lifecycle
      When the client creates a fitting then list fittings then delete it
      Then each operation shall succeed in sequence

  # ── Unauthorised access ─────────────────────────────────────────────

  Rule: If a fittings request is answered with HTTP 403, then the Fittings client shall reject with an EsiError.
    Read and write on fittings are separate ESI scopes, so a token good enough
    to list is not necessarily good enough to create. Both paths surface the
    refusal as the same typed rejection, letting callers branch on error class
    rather than on message text.

    Scenario: Listing fittings with an expired token
      Given an invalid or expired token for fittings
      When the client requests fittings with invalid token
      Then the client shall return a 403 forbidden error for fittings

    Scenario: Creating a fitting without the write scope
      Given insufficient permissions for fitting creation
      When the client attempts to create a fitting
      Then the client shall return a 403 forbidden error for creation
