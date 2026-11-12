@TEST-10
Feature: Wallets
  The Wallet client covers the money endpoints for both a character and a
  corporation: the current ISK balance, the journal of every movement with its
  reference type and running balance, and the market transaction records
  behind those movements. Corporation wallets are split across seven
  divisions, each addressed separately. Everything here is authenticated, and
  the corporation endpoints additionally need director-level roles.

  # ── Character balance ───────────────────────────────────────────────

  Rule: When a character wallet balance is requested, the Wallet client shall return the balance as a number.
    The endpoint returns a bare JSON number rather than an object, so the
    client passes it through as a number instead of wrapping it. A wallet with
    nothing in it returns zero, which is a value a caller has to be able to
    tell apart from a missing response.

    Scenario: Funded wallet returns the ISK amount as a number
      Given an authenticated character for wallet
      When the client requests their wallet balance
      Then the client shall return the ISK amount

    Scenario: Empty wallet returns zero
      Given a character with no ISK
      When the client requests the zero balance
      Then the client shall return zero

  # ── Character journal and transactions ──────────────────────────────

  Rule: When a character wallet journal is requested, the Wallet client shall return one entry per movement carrying its identifier, date, and reference type, and its amount and resulting balance when present.
    The reference type is what classifies a movement as a bounty, a market
    trade, or a transfer, and the running balance lets a caller reconstruct
    the account history without re-adding the amounts. Amounts are signed, so
    income and expenditure share one field.

    Scenario: Journal returns identifier, date, reference type, amount, and balance per entry
      Given an authenticated character with transaction history
      When the client requests their wallet journal
      Then the client shall return journal entries

  Rule: If a character has recorded no wallet movements, then the Wallet client shall return an empty array.
    A newly created character has an empty journal rather than a missing one.
    Returning an empty array keeps the response shape stable so callers can
    iterate without a null check.

    Scenario: New character with no movements returns an empty journal array
      Given a new character with no activity
      When the client requests the new character wallet journal
      Then the client shall return an empty journal array

  Rule: When character wallet transactions are requested, the Wallet client shall return one record per trade carrying its transaction identifier, type identifier, unit price, quantity, and buy flag.
    Transactions are the market-side detail behind the market_transaction
    journal entries. Unit price and quantity are separate numbers rather than
    a pre-multiplied total, and the buy flag gives the direction of the trade.

    Scenario: Transactions return unit price, quantity, and buy flag per record
      Given an authenticated character with market activity
      When the client requests their transactions
      Then the client shall return transaction records

  # ── Corporation divisions ───────────────────────────────────────────

  Rule: When corporation wallets are requested, the Wallet client shall return one entry per division carrying the division number and its balance.
    A corporation has seven wallet divisions and the listing returns all of
    them in division order, including any left at zero. That ordering is what
    lets a caller map a division number straight onto a display row.

    Scenario: Seven corporation divisions return their division numbers and balances
      Given an authenticated director
      When the client requests corporation wallets
      Then the client shall return all wallet divisions

  Rule: When a corporation wallet history is requested with a division number, the Wallet client shall return the records booked to that division.
    Journal and transaction history are per-division, not per-corporation, so
    the division number is part of the path rather than a filter applied after
    the fact. Both histories are exercised because they share that addressing.

    Scenario: Division 1 journal returns entries booked to that division
      Given an authenticated director for journal
      When the client requests the journal for division 1
      Then the client shall return journal entries for that division

    Scenario: Division 1 transactions return records booked to that division
      Given an authenticated director for transactions
      When the client requests transactions for division 1
      Then the client shall return corporation transaction records

  # ── Paging helpers ──────────────────────────────────────────────────

  @DES-08
  Rule: When a wallet journal or transaction history is collected or streamed page by page, the Wallet client shall return every entry of every page in page order.
    The journal and transaction routes are paged, and each one has a pair of
    helpers beside its eager method: fetchAllCharacterWalletJournal,
    fetchAllCorporationWalletJournal, fetchAllCharacterWalletTransactions and
    fetchAllCorporationWalletTransactions request the pages after the first
    concurrently, and streamCharacterWalletJournal,
    streamCorporationWalletJournal, streamCharacterWalletTransactions and
    streamCorporationWalletTransactions yield one page at a time, as
    guides/PAGINATION.md describes. 0073-page-walks.feature specifies the walk
    once; these hold each wallet helper to it.

    Scenario: A character journal collected across three pages
      Given ESI answers the "character wallet journal" with 3 pages of 2 entries each
      When the client walks the "character wallet journal" through the fetch-all helper
      Then the walk shall resolve with the entries of pages 1 to 3
      And the client shall have sent 3 requests

    Scenario: A corporation division's transactions collected across two pages
      Given ESI answers the "corporation wallet transactions" with 2 pages of 2 entries each
      When the client walks the "corporation wallet transactions" through the fetch-all helper
      Then the walk shall resolve with the entries of pages 1 to 2
      And the client shall have sent 2 requests

    Scenario: A character's transactions streamed across two pages
      Given ESI answers the "character wallet transactions" with 2 pages of 2 entries each
      When the client walks the "character wallet transactions" through the stream helper
      Then the walk shall resolve with the entries of pages 1 to 2
      And the client shall have sent 2 requests

    Scenario: A corporation division's journal streamed across three pages
      Given ESI answers the "corporation wallet journal" with 3 pages of 2 entries each
      When the client walks the "corporation wallet journal" through the stream helper
      Then the walk shall resolve with the entries of pages 1 to 3
      And the client shall have sent 3 requests

  @DES-08
  Rule: Where incompletePages is left at its default, if the last page of a wallet journal or transaction walk comes back empty, then the Wallet client shall return the entries of the pages before it and log one incompletePages warning.
    An empty page means the history shrank while it was being read, usually
    because older entries aged out of ESI's 30-day window. The default keeps
    what the walk fetched, and the warning is the only sign it is short.

    Scenario: A character journal whose second page of two comes back empty, streamed
      Given a client in incompletePages mode "truncate" with a recording logger
      And ESI answers the "character wallet journal" with 2 pages, the last one empty
      When the client walks the "character wallet journal" through the stream helper
      Then the walk shall resolve with the entries of pages 1 to 1
      And the logger shall have received one incompletePages warning for reason "empty-page" with 2 fetched pages

    Scenario: A corporation division's journal whose second page of two comes back empty, collected
      Given a client in incompletePages mode "truncate" with a recording logger
      And ESI answers the "corporation wallet journal" with 2 pages, the last one empty
      When the client walks the "corporation wallet journal" through the fetch-all helper
      Then the walk shall resolve with the entries of pages 1 to 1
      And the logger shall have received one incompletePages warning for reason "empty-page" with 2 fetched pages

  @DES-08
  Rule: Where incompletePages is set to throw, if the last page of a wallet journal or transaction walk comes back empty, then the Wallet client shall reject with an EsiPaginationError whose reason is empty-page.
    A caller reconciling a wallet would rather fail than total a history with
    a hole in it. A collected walk carries the entries it fetched before the
    empty page; a stream has yielded them already, so its error counts them.

    Scenario: A character's transactions whose second page of two comes back empty, collected
      Given a client in incompletePages mode "throw" with a recording logger
      And ESI answers the "character wallet transactions" with 2 pages, the last one empty
      When the client walks the "character wallet transactions" through the fetch-all helper
      Then the walk shall reject with an EsiPaginationError whose reason is "empty-page" carrying the entries of pages 1 to 1

    Scenario: A corporation division's transactions whose second page of two comes back empty, streamed
      Given a client in incompletePages mode "throw" with a recording logger
      And ESI answers the "corporation wallet transactions" with 2 pages, the last one empty
      When the client walks the "corporation wallet transactions" through the stream helper
      Then the walk shall reject with an EsiPaginationError whose reason is "empty-page" counting 2 items

  # ── Authorisation ───────────────────────────────────────────────────

  Rule: If a wallet request is made without the scope or corporation role it needs, then the Wallet client shall reject the request with an EsiError.
    Wallet data is the most sensitive thing ESI exposes, so both a token
    without the wallet scope and a member without director rights are refused
    by ESI with a 403. The client raises a typed EsiError in either case rather
    than returning a zero balance. A client with no token at all never reaches
    ESI: it throws a NO_AUTH_TOKEN error, which is not an EsiError, before
    sending the request.

    Scenario: Character wallet request without a token rejects with an EsiError
      Given an unauthenticated user for character wallet
      When the client requests a character wallet balance without auth
      Then the client shall return a 403 forbidden error for character wallet

    Scenario: Corporation wallet request without director rights rejects with an EsiError
      Given a non-director character for corporation wallet
      When the client requests corporation wallets without auth
      Then the client shall return a 403 forbidden error for corporation wallet

  # ── Composition ─────────────────────────────────────────────────────

  Rule: The Wallet client shall return the balance, journal, and transaction payloads independently when all three are requested concurrently.
    A financial view needs all three at once, and the balance endpoint returns
    a number while the other two return arrays. The three in-flight calls
    resolve to their own payloads with their own shapes.

    Scenario: Concurrent balance, journal, and transaction calls each resolve independently
      Given an authenticated character for concurrent wallet ops
      When the client fetches balance, journal, and transactions concurrently
      Then all wallet data shall complete successfully

  Rule: When journal and transaction payloads are combined, the Wallet client shall return signed journal amounts and transaction buy flags that total into income, expenditure, and trade direction counts.
    Nothing in ESI reports income and expenditure separately, so a caller
    derives them by partitioning the journal on the sign of the amount and the
    transactions on the buy flag. That arithmetic only holds if amounts keep
    their sign and the flag is a real boolean.

    Scenario: Journal amounts and buy flags total into income, expenditure, and trade counts
      Given an authenticated character with financial history
      When the client gathers all financial data
      Then the client shall compute a financial summary
