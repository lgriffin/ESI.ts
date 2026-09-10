Feature: Contract Management
  The Contracts client covers the contract endpoints of ESI: the contracts a
  character or a corporation is party to, the public contracts listed in a
  region, and the two follow-up reads that open a contract up — the bids placed
  on an auction and the item lines being exchanged. A contract header carries
  no items and no bids of its own, so inspecting one always means a list read
  followed by the detail reads.

  # ── Character and corporation contracts ─────────────────────────────

  Rule: When character contracts are requested for a character ID, the Contracts client shall return an array whose entries each carry contract_id, type, status, price, and issuer_id.
    The type separates a courier run from an item exchange from an auction,
    and the status separates live contracts from settled ones. Both scenarios
    below read those fields: the first on a two-entry list, the second by
    filtering a mixed list down to one type at the call site.

    Scenario: Contract list holding a courier contract and an item exchange contract
      Given a character with contracts
      When the client requests character contracts
      Then the client shall return a list of contracts

    Scenario: Mixed contract list filtered by the caller on the type field
      Given a character with mixed contract types
      When the client retrieves and filter by courier type
      Then the client shall return only courier contracts

  Rule: If a character has no contracts, then the Contracts client shall return an empty array.
    A character who has never issued or accepted a contract is an ordinary
    case. Returning an empty array rather than null keeps the call site free
    of a special case before iterating.

    Scenario: Character with an empty contract list
      Given a character with no contracts
      When the client requests character contracts for the empty list
      Then the client shall return an empty array

  Rule: When character contracts and corporation contracts are requested concurrently, the Contracts client shall resolve each call with the list belonging to its own holder.
    A character can issue contracts on their own behalf and on their
    corporation's, and the two lists overlap in issuer but not in scope. The
    for_corporation flag is what tells them apart, so neither call may answer
    the other.

    Scenario: Character list and corporation list fetched at once
      Given a character in a corporation
      When the client fetches both sets of contracts concurrently
      Then the client shall return independent results

  # ── Public contracts ────────────────────────────────────────────────

  Rule: When public contracts are requested for a region ID, the Contracts client shall return an array whose entries each carry availability and status.
    The public listing is the region-wide market in contracts and needs no
    token. Availability marks an entry as open to anyone rather than to a
    named party, and status marks it as still outstanding.

    Scenario: Public contracts outstanding in a region
      Given a valid region ID
      When the client requests public contracts
      Then the client shall return contracts available in that region

  # ── Contract contents ───────────────────────────────────────────────

  Rule: When bids are requested for an auction contract, the Contracts client shall return an array whose entries each carry bid_id, bidder_id, and amount.
    Bids decide who wins an auction, so the amount and the bidder are the
    whole content of an entry. The private read and the public read return the
    same entry shape, which is why both scenarios sit here; the difference is
    only whether a token scopes the request to the caller's own contract.

    Scenario: Bid history on a character auction contract
      Given an auction contract with bids
      When the client requests contract bids
      Then the client shall return a list of bids

    Scenario: Bid history on a public auction contract
      Given a public auction contract
      When the client requests public contract bids
      Then the client shall return the bid history

  Rule: When items are requested for a character contract, the Contracts client shall return an array whose entries each carry type_id, quantity, and is_included.
    The is_included flag separates what the issuer is offering from what they
    are asking for in return, so reading an item line without it inverts the
    meaning of the contract.

    Scenario: Item lines on an item exchange contract
      Given an item exchange contract
      When the client requests contract items
      Then the client shall return the list of items

  Rule: When a contract is located in the character list and its bids and items are then requested, the Contracts client shall resolve every call in the sequence.
    This is the ordinary inspection path: find the contract, then open it. The
    contract ID feeding the two detail calls comes from the list response, so
    the sequence is ordered rather than a plain fan-out.

    Scenario: Contract located in the list, then its bids and items
      Given an active auction contract
      When the client retrieves the contract then fetch its bids and items
      Then the client shall have full contract details

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If a contract request fails, then the Contracts client shall reject with an EsiError.
    One error type across the domain keeps the call site to a single catch,
    whether the failure came from an unknown character, an expired token, or a
    contract that has already been settled and removed.

    Scenario: Unknown character ID rejects the request
      Given an invalid character ID for contracts
      When the client requests character contracts for the invalid character
      Then the client shall return a 404 not found error
