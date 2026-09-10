Feature: Contact Management
  The Contacts client covers the contact lists a character or a corporation
  keeps, together with the labels used to group them. Standings on these lists
  drive who a consuming application treats as friendly and who it flags, so
  the entry shape and the sign of the standing both matter. The character list
  is writable: contacts can be added at a chosen standing and removed by ID.

  # ── Reading contact lists ───────────────────────────────────────────

  Rule: When a contact list is requested for a character ID or a corporation ID, the Contacts client shall return an array whose entries each carry contact_id, contact_type, standing, and label_ids.
    The contact_type discriminates a character from a corporation from an
    alliance, which is what tells the caller which domain to resolve the ID
    against. Standings run negative as well as positive, and the sign is the
    whole point of the entry, so it survives the round trip untouched.

    Scenario: Character contact list spanning character, corporation, and alliance entries
      Given a character with contacts
      When the client requests character contacts
      Then the client shall return a list of contacts with standings

    Scenario: Corporation contact list holding an allied alliance and a hostile character
      Given a valid corporation ID for contacts
      When the client requests corporation contacts
      Then the client shall return the corporation contact list

  Rule: If a character has no contacts, then the Contacts client shall return an empty array.
    An empty contact list is an ordinary state, not an error. Returning an
    empty array rather than null keeps the call site free of a special case
    before iterating.

    Scenario: Character with an empty contact list
      Given a character with no contacts
      When the client requests character contacts for the empty list
      Then the client shall return an empty array

  Rule: When contact labels are requested, the Contacts client shall return an array whose entries each carry label_id and label_name.
    Contact entries reference labels only by ID, so the label endpoint is what
    turns those IDs into text a person can read. Character labels and
    corporation labels are separate endpoints with the same entry shape, which
    is why both scenarios sit here.

    Scenario: Character labels naming friendly, hostile, and neutral
      Given a character with custom labels
      When the client requests contact labels
      Then the client shall return the label definitions

    Scenario: Corporation labels naming war targets and allies
      Given a corporation with custom labels
      When the client requests corporation contact labels
      Then the client shall return the corporation label definitions

  # ── Writing the character contact list ──────────────────────────────

  Rule: When contacts are added for a character ID, the Contacts client shall return the contact IDs accepted by ESI.
    The add call answers with the IDs that were actually created, which is not
    always the full set submitted — an ID already on the list is not added
    twice. Returning that answer is what lets a caller reconcile its own view.

    Scenario: Two contacts added at standing five
      Given contact data with standings
      When the client adds contacts
      Then the client shall return the IDs of the added contacts

  Rule: When contacts are deleted for a character ID, the Contacts client shall pass the character ID and the contact ID list through to the delete call unchanged.
    Deletion carries no response body, so the only observable is what was
    sent. Sending the ID list as given is what keeps a caller from silently
    removing a contact it did not name.

    Scenario: Two contacts deleted by ID
      Given existing contact IDs
      When the client deletes those contacts
      Then the deletion shall complete successfully

  Rule: When a contact list read is followed by an add and a second read, the Contacts client shall return the added contact in the result of the second read.
    This is the ordinary edit path: see what is there, add, confirm. The
    second read has to reflect the write rather than answer from a cached copy
    of the first, which is what makes the sequence worth stating.

    Scenario: List, add, and re-read showing the new contact
      Given a character managing contacts
      When the client lists contacts then add new ones and verify
      Then the full workflow shall succeed

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If a contact request is rejected for lack of authorization, then the Contacts client shall reject with an EsiError.
    Contact endpoints are token-scoped and tokens expire mid-session.
    Surfacing the refusal as the domain error type puts it on the same
    handling path as any other failure rather than as an empty contact list.

    Scenario: Expired token on the character contacts endpoint rejects the request
      Given an invalid or expired token for contacts
      When the client requests character contacts without authorization
      Then the client shall return a 403 forbidden error
