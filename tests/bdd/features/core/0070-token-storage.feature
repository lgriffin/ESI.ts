Feature: Token storage records
  The token manager keeps tokens in an ITokenStorage. Two ship with the
  library: FileTokenStorage, a JSON file written atomically with owner-only
  permissions, and MemoryTokenStorage, a map that lives as long as the
  process. 0054-token-management.feature covers sharing a file between
  processes; this file covers what each storage keeps, returns and refuses.

  The file scenarios work in a temporary directory removed after each one,
  and write the token file directly where a scenario needs a damaged entry.

  # ── FileTokenStorage ──────────────────────────────────────────────

  Rule: If the token file holds an entry with a missing or mistyped field, then the file token storage shall leave that entry out and return the rest.
    A record cut short or edited by hand would otherwise reach the token
    manager and crash the first call that reads its scopes or expiry. One
    bad record must not cost the others.

    Scenario Outline: An entry whose <field> is <value> is left out
      Given a token file holding character 90000001 and character 90000002 with "<field>" set to '<value>'
      When a file token storage reads the file
      Then the file token storage shall return only character 90000001

      Examples:
        | field         | value         |
        | characterId   | "90000002"    |
        | characterName | 5             |
        | accessToken   | 5             |
        | refreshToken  | 5             |
        | expiresAt     | "soon"        |
        | updatedAt     | "now"         |
        | scopes        | ["a", 5]      |
        | scopes        | "a"           |
        | ownerHash     | 5             |
        | revokedAt     | "yesterday"   |

    Scenario Outline: An entry that is <value> is left out
      Given a token file holding character 90000001 and the entry '<value>' for character 90000002
      When a file token storage reads the file
      Then the file token storage shall return only character 90000001

      Examples:
        | value  |
        | null   |
        | "text" |

  Rule: When the token file holds an entry with an owner hash and a revocation time, the file token storage shall return that entry with both.
    Both fields are optional, and a record that has them is as valid as
    one that does not.

    Scenario: An entry with the optional fields is kept
      Given a token file holding character 90000001 with the owner hash "owner-xyz" and a revocation time
      When a file token storage reads the file
      Then the file token storage shall return character 90000001 with the owner hash "owner-xyz" and a revocation time

  Rule: When a token is written, the file token storage shall return it, scopes included, from the same instance and from a new instance on the same path.
    The scopes decide which endpoints the token manager calls for a
    character, so a record that loses them on the way to disk or back is
    as good as lost.

    Scenario: A written token comes back with its scopes
      Given a file token storage
      When character 90000001 is written to it with the scopes "esi-wallet.read_character_wallet.v1 esi-skills.read_skills.v1"
      Then the file token storage shall return character 90000001 with those scopes
      And a new file token storage on the same path shall return character 90000001 with those scopes

  Rule: When a character is deleted, the file token storage shall remove that character from the token file.
    A removed character must stay removed after a restart, whether or not
    the file is shared between processes.

    Scenario Outline: Deleting a character <locking>
      Given a file token storage <locking> holding characters 90000001 and 90000002
      When character 90000002 is deleted from it
      Then a new file token storage on the same path shall hold only character 90000001

      Examples:
        | locking         |
        | without locking |
        | with locking    |

  @sec-P10 @SEC-10
  Rule: The file token storage shall write the token file with the permission bits 0600 unless told otherwise.
    The file holds refresh tokens, which are long-lived credentials, so no
    other user on the machine may read it.

    Scenario: The token file is readable by its owner only
      Given a file token storage
      When character 90000001 is written to it with the scopes "esi-wallet.read_character_wallet.v1"
      Then the token file shall have the permission bits 0600

  Rule: If the token file cannot be read for a reason other than not existing, then the file token storage shall reject with the file system's error.
    A missing file is a first run and reads as empty. Anything else (a
    directory in its place, a permission problem) has to surface, or the
    manager would start from nothing and overwrite the tokens on its first
    write.

    Scenario: A directory at the token file's path is an error
      Given a directory where the token file should be
      When a file token storage reads the file
      Then the read shall reject with the file system error "EISDIR"

  Rule: If a lock timing is not a positive, finite number of milliseconds, then the file token storage shall throw RangeError when constructed.
    A zero or negative timeout would fail every write at once, and an
    infinite one would wait forever behind a crashed holder.

    Scenario Outline: A lock <timing> of <value> is refused
      When a file token storage is built with the lock <timing> <value>
      Then the construction shall throw RangeError naming "lock.<timing>"

      Examples:
        | timing    | value    |
        | staleMs   | 0        |
        | timeoutMs | -1       |
        | retryMs   | Infinity |
        | staleMs   | NaN      |

  # ── MemoryTokenStorage ────────────────────────────────────────────

  Rule: Where the memory token storage is built with initial tokens, the memory token storage shall return each of them, scopes included.
    A test or a CLI seeds the store from tokens it already has.

    Scenario: Seeded tokens are returned
      When a memory token storage is built with character 90000001 holding the scopes "esi-wallet.read_character_wallet.v1"
      Then the memory token storage shall list character 90000001 with the scopes "esi-wallet.read_character_wallet.v1"

  Rule: When the memory token storage is cleared, the memory token storage shall hold no tokens.
    Clearing resets a store between test cases or user sessions.

    Scenario: Clearing empties the store
      When a memory token storage is built with character 90000001 holding the scopes "esi-wallet.read_character_wallet.v1"
      And the memory token storage is cleared
      Then the memory token storage shall list no tokens
