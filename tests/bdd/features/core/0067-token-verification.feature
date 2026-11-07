@SEC-10
Feature: Access token decoding and verification
  `verifyAccessToken` checks an EVE SSO access token a third party hands the
  application: the token is a JWT, its header names RS256 and a key id, the
  signature verifies against that key in EVE SSO's published key set, the
  issuer is EVE SSO, the audience names the application, and the token has
  not expired. `SsoJwks` fetches and caches that key set. Both are public, and
  the token manager's opt-in verification is built on them.

  These scenarios call them directly. EVE SSO's key set is served by a fetch
  the scenario passes in, which records each request, and the clock is one the
  scenario moves. Tokens are signed with a stand-in for SSO's current key.

  # ── decodeAccessToken ──────────────────────────────────────────────

  Rule: When an access token is decoded, decodeAccessToken shall return the character id from its sub claim, its scopes, its expiry in milliseconds and its owner hash.
    These are the fields the token manager stores. exp is in seconds, like
    every JWT time, and the stored expiry is in milliseconds, like Date.now().

    Scenario: Every stored field is read from the claims
      When an access token with these claims is decoded:
        """
        { "sub": "CHARACTER:EVE:2114794365", "name": "Aurora Vale", "scp": ["esi-wallet.read_character_wallet.v1", "esi-skills.read_skills.v1"], "exp": 1800000000, "owner": "owner-abc" }
        """
      Then the decoded token shall carry:
        """
        { "characterId": 2114794365, "characterName": "Aurora Vale", "scopes": ["esi-wallet.read_character_wallet.v1", "esi-skills.read_skills.v1"], "expiresAt": 1800000000000, "ownerHash": "owner-abc" }
        """

  Rule: When an access token's scp claim is a single string, decodeAccessToken shall split it on spaces into scopes, leaving out empty entries.
    SSO writes one scope as a string rather than a one-entry list, and a
    space-separated string is how OAuth writes several.

    Scenario: A space-separated scope string becomes a list
      When an access token with these claims is decoded:
        """
        { "sub": "CHARACTER:EVE:2114794365", "scp": "esi-wallet.read_character_wallet.v1  esi-skills.read_skills.v1 " }
        """
      Then the decoded token shall carry:
        """
        { "scopes": ["esi-wallet.read_character_wallet.v1", "esi-skills.read_skills.v1"] }
        """

  Rule: If an access token's scp claim is a list, then decodeAccessToken shall keep only the list's string entries as scopes.
    A scope is a name; anything else in the list cannot be checked against
    an endpoint's required scopes.

    Scenario: A number in the scope list is left out
      When an access token with these claims is decoded:
        """
        { "sub": "CHARACTER:EVE:2114794365", "scp": ["esi-wallet.read_character_wallet.v1", 5] }
        """
      Then the decoded token shall carry:
        """
        { "scopes": ["esi-wallet.read_character_wallet.v1"] }
        """

  Rule: If an access token has no scp claim, then decodeAccessToken shall return an empty scope list.
    A login that asked for no scopes is a valid login; it can call only
    public endpoints.

    Scenario: A token without scopes decodes with none
      When an access token with these claims is decoded:
        """
        { "sub": "CHARACTER:EVE:2114794365" }
        """
      Then the decoded token shall carry:
        """
        { "scopes": [] }
        """

  Rule: If an access token's sub claim is not exactly CHARACTER:EVE followed by a character id, then decodeAccessToken shall throw TokenDecodeError.
    The character id is the key every stored token lives under, so a subject
    with anything before or after it is refused rather than half-read.

    Scenario Outline: A subject with <extra> is refused
      When an access token with the subject "<sub>" is decoded
      Then the decoding shall throw TokenDecodeError saying "not a character subject"

      Examples:
        | extra               | sub                       |
        | a prefix            | xCHARACTER:EVE:2114794365 |
        | a suffix            | CHARACTER:EVE:2114794365x |

  Rule: If an access token does not have three segments or its payload is not a JSON object, then decodeAccessToken shall throw TokenDecodeError saying which.
    The message tells a developer whether they passed something that is not
    a JWT at all, or a JWT whose payload is damaged.

    Scenario: A token with a fourth segment is refused
      When an access token for character 2114794365 with a fourth segment is decoded
      Then the decoding shall throw TokenDecodeError saying "three dot-separated segments"

    Scenario Outline: A payload that is <kind> is refused
      When an access token whose payload segment is '<payload>' is decoded
      Then the decoding shall throw TokenDecodeError saying "<message>"

      Examples:
        | kind         | payload  | message           |
        | not JSON     | {sub:    | is not valid JSON |
        | a number     | 5        | is not an object  |
        | null         | null     | is not an object  |

  # ── verifyAccessToken ──────────────────────────────────────────────

  Rule: When an access token passes every check, verifyAccessToken shall resolve with the character the token names.
    Every other Rule here is a reason to refuse a token; this one shows the
    checks let a good token through, including one whose issuer is written
    without the scheme, the other form SSO uses.

    Scenario: A token signed by SSO's current key is accepted
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key is verified
      Then the verification shall resolve with character 2114794365

    Scenario: A token whose issuer has no scheme is accepted
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key with the claim "iss" set to '"login.eveonline.com"' is verified
      Then the verification shall resolve with character 2114794365

  @sec-P5
  Rule: If an access token does not have exactly three non-empty dot-separated segments, then verifyAccessToken shall reject it with TokenVerificationError for reason malformed.
    A JWS compact token is a header, a payload and a signature. A token with
    a segment missing or one too many is not one, whatever the segments it
    does have would verify as.

    Scenario: A token with a fourth segment is rejected
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key with ".extra" appended is verified
      Then the verification shall reject with TokenVerificationError for reason "malformed"

    Scenario: A token with an empty payload segment is rejected
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key with its payload segment emptied is verified
      Then the verification shall reject with TokenVerificationError for reason "malformed"

    Scenario: A token with an empty signature segment is rejected
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key with its signature segment emptied is verified
      Then the verification shall reject with TokenVerificationError for reason "malformed"

  @sec-P5
  Rule: If an access token's header is not a JSON object, then verifyAccessToken shall reject it with TokenVerificationError for reason malformed.
    The header is read for its algorithm and key id before anything is
    verified. JSON that is a number, null or an array has neither.

    Scenario Outline: A header that is <kind> is rejected
      Given EVE SSO publishes its current signing key
      When a token whose header segment is '<header>' is verified
      Then the verification shall reject with TokenVerificationError for reason "malformed"

      Examples:
        | kind     | header |
        | a number | 5      |
        | null     | null   |
        | an array | []     |

  @sec-P5
  Rule: If an access token's header names an algorithm other than RS256, then verifyAccessToken shall reject it with TokenVerificationError for reason algorithm.
    SSO signs with RS256 only. Accepting the algorithm a token claims is the
    classic JWT forgery, so the header has to name RS256 even when the
    signature would verify.

    Scenario: A token whose header names RS512 is rejected
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key with the header "alg" set to '"RS512"' is verified
      Then the verification shall reject with TokenVerificationError for reason "algorithm"

  @sec-P5
  Rule: If an access token's iss claim is not EVE SSO, then verifyAccessToken shall reject it with TokenVerificationError for reason issuer.
    The key set is EVE SSO's, but the issuer is checked as well so a token
    minted for another issuer that shares the key cannot pass.

    Scenario: A token issued by another host is rejected
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key with the claim "iss" set to '"https://login.example.com"' is verified
      Then the verification shall reject with TokenVerificationError for reason "issuer"

  @sec-P5
  Rule: If the current time is at or past an access token's exp claim plus the clock tolerance, then verifyAccessToken shall reject it with TokenVerificationError for reason expired, naming the expiry time.
    exp is the first second the token is no longer valid. A tolerance lets a
    server whose clock runs ahead of SSO's accept a token that has only just
    been issued. The error names the expiry time, so a log line shows how
    stale the token was.

    Scenario: A token is rejected at the second it expires
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key that expires now is verified
      Then the verification shall reject with TokenVerificationError for reason "expired"
      And the rejection shall name the token's expiry time

    Scenario: A token that expired inside the clock tolerance is accepted
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key that expired 30 seconds ago is verified with a clock tolerance of 60 seconds
      Then the verification shall resolve with character 2114794365

  Rule: Where verifyAccessToken is given a custom fetch and no key set cache, verifyAccessToken shall fetch EVE SSO's key set through that fetch.
    An application behind a proxy or with its own HTTP stack passes its
    fetch, and the key set request has to go through it too.

    Scenario: The key set is fetched through the custom fetch
      Given EVE SSO publishes its current signing key
      When a token signed by SSO's current key is verified with a custom fetch and no clock
      Then the verification shall resolve with character 2114794365
      And the number of key set fetches shall be 1

  Rule: Where verifyAccessToken is given a clock and no key set cache, verifyAccessToken shall fetch EVE SSO's key set for that call alone.
    Calls with the default fetch and clock share one process-wide cache. A
    clock override is a test or a simulation, so it gets a cache of its own
    rather than sharing one with the rest of the process.

    Scenario: Two calls with a clock each fetch the key set
      Given EVE SSO publishes its current signing key on the global fetch
      When two tokens signed by SSO's current key are verified with a clock and no fetch
      Then both verifications shall resolve with character 2114794365
      And the number of key set fetches on the global fetch shall be 2

  # ── SsoJwks: caching ───────────────────────────────────────────────

  Rule: Where no cache TTL is given, the key set cache shall reuse a fetched key set for one hour.
    SSO rotates its key rarely. An hour keeps verification off the network
    for almost every token and still picks up a rotation the same hour.

    Scenario: A key read 59 minutes later comes from the cache
      Given EVE SSO publishes its current signing key
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      And 3540000 ms pass
      And the cache is asked for SSO's current key
      Then the cache shall return SSO's current key
      And the number of key set fetches shall be 1

    Scenario: A key read an hour later fetches the key set again
      Given EVE SSO publishes its current signing key
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      And 3600000 ms pass
      And the cache is asked for SSO's current key
      Then the cache shall return SSO's current key
      And the number of key set fetches shall be 2

  Rule: When the cached key set holds the requested key id, the key set cache shall return that key without fetching the key set again.
    A known key id is the common case. The scenario sets the refetch
    cooldown to zero, so nothing but the cache itself stands between the
    second read and a second fetch.

    Scenario: A known key id is served from the cache
      Given EVE SSO publishes its current signing key
      And a key set cache with a refetch cooldown of 0 ms
      When the cache is asked for SSO's current key
      And the cache is asked for SSO's current key
      Then the cache shall return SSO's current key
      And the number of key set fetches shall be 1

  Rule: If a requested key id is missing from the cached key set and the last fetch started less than the refetch cooldown ago, then the key set cache shall reject with TokenVerificationError for reason unknown-key without fetching the key set again.
    A missing key id may mean SSO rotated its key, so the cache refetches,
    but at most once per cooldown (a minute by default), so a stream of
    made-up key ids cannot hammer SSO.

    Scenario: An unknown key id inside the cooldown is refused without a fetch
      Given EVE SSO publishes its current signing key
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      And 59999 ms pass
      And the cache is asked for the key id "rotated-key"
      Then the cache shall reject with TokenVerificationError for reason "unknown-key"
      And the number of key set fetches shall be 1

    Scenario: An unknown key id once the cooldown has passed fetches again
      Given EVE SSO publishes its current signing key
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      And 60000 ms pass
      And the cache is asked for the key id "rotated-key"
      Then the cache shall reject with TokenVerificationError for reason "unknown-key"
      And the number of key set fetches shall be 2

  Rule: When the key set cache fetches EVE SSO's key set, the key set cache shall send a GET request that accepts application/json and names the library in its User-Agent.
    SSO asks API clients to identify themselves, and a key set fetched as
    anything but JSON cannot be read.

    Scenario: The key set request identifies the library
      Given EVE SSO publishes its current signing key
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      Then the key set request shall be a GET accepting "application/json" with a User-Agent naming "@lgriffin/esi.ts"

  # ── SsoJwks: failures ──────────────────────────────────────────────

  Rule: If no key set has loaded because fetching it failed, then the key set cache shall reject with TokenVerificationError for reason jwks-unavailable, naming why the fetch failed.
    A verification failure caused by SSO being down has to read differently
    from a bad token, and its message has to say what went wrong.

    Scenario: The key set endpoint answers HTTP 503
      Given EVE SSO's key set endpoint answers HTTP 503
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      Then the cache shall reject with TokenVerificationError for reason "jwks-unavailable" naming "HTTP 503"

    Scenario: The key set endpoint cannot be reached
      Given EVE SSO's key set endpoint fails with the network error "connect ECONNREFUSED"
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      Then the cache shall reject with TokenVerificationError for reason "jwks-unavailable" naming "connect ECONNREFUSED"

    Scenario: The key set holds no keys
      Given EVE SSO's key set endpoint answers with the body '{"keys":[]}'
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      Then the cache shall reject with TokenVerificationError for reason "jwks-unavailable" naming "holds no RS256 keys"

  Rule: If EVE SSO's key set document is not an object with a keys list, then the key set cache shall reject with TokenVerificationError for reason jwks-unavailable.
    A proxy error page or a changed format must not be read as a key set,
    and must not throw anything but the verification error callers handle.

    Scenario Outline: A key set body that is <kind> is refused
      Given EVE SSO's key set endpoint answers with the body '<body>'
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      Then the cache shall reject with TokenVerificationError for reason "jwks-unavailable"

      Examples:
        | kind                     | body           |
        | null                     | null           |
        | an object with no keys   | {}             |
        | a keys field not a list  | {"keys":"one"} |

  # ── SsoJwks: which keys count ──────────────────────────────────────

  Rule: When EVE SSO's key set lists an entry that is not an RSA key with a key id, a non-empty modulus and exponent, and the RS256 algorithm or none, the key set cache shall leave that entry out.
    Only RS256 keys can verify an SSO token. A key of another type or for
    another algorithm, or one missing a part, is skipped rather than trusted.

    Scenario Outline: SSO's key with <field> set to <value> is left out
      Given EVE SSO publishes only its current signing key with "<field>" set to '<value>'
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      Then the cache shall reject with TokenVerificationError for reason "<reason>"

      Examples:
        | field | value    | reason           |
        | kty   | "EC"     | jwks-unavailable |
        | kid   | 5        | jwks-unavailable |
        | n     | ""       | jwks-unavailable |
        | e     | ""       | jwks-unavailable |
        | alg   | "RS512"  | jwks-unavailable |

    Scenario: An entry that is null is skipped and the key after it is used
      Given EVE SSO publishes its current signing key after a null entry
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      Then the cache shall return SSO's current key

    Scenario: A key with no algorithm is used
      Given EVE SSO publishes only its current signing key with "alg" removed
      And a key set cache with the default settings
      When the cache is asked for SSO's current key
      Then the cache shall return SSO's current key
