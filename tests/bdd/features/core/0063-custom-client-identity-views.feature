@ARCH-08
Feature: Identity views of the custom clients
  An application that acts for several characters used to build one custom
  client per character, each with its own rate limiter, error budget and
  cache, or swap the token on one client between calls. `EsiClient.as(identity)`
  and `CustomEsiClient.as(identity)` hand out a view per character: the same
  domain clients, sending as that identity, over the client's one cache, rate
  limiter, circuit breaker and deduplicator (option D step 4,
  guides/CLIENT-ARCHITECTURE.md). The identity is the one `createEsi`'s
  `esi.as(identity)` takes: an EsiTokenManager character, a raw access token
  or a TokenProvider.

  These scenarios drive the custom domain clients through the real request
  pipeline to the transport seam and read what went over the wire.

  # ── The bearer a view sends

  Rule: When an identity view of an EsiClient requests an authenticated method, the EsiClient shall send the identity's current access token as the bearer.
    The client the view came from holds no token, so the bearer can only come
    from the view's identity.

    Scenario: A raw access token is sent as given
      Given an EsiClient that holds no token
      And an identity view of the EsiClient for a character holding an access token
      And ESI reports the character's wallet balance
      When the identity view requests the character's wallet balance
      Then the request shall carry the header "Authorization" with the value "Bearer raw-access-token"

    Scenario: A custom token provider is asked for the token on each request
      Given an EsiClient that holds no token
      And an identity view of the EsiClient whose provider hands out a new token on each call
      And ESI reports the character's wallet balance twice
      When the identity view requests the character's wallet balance twice
      Then the two requests shall carry the provider's first and second tokens

  Rule: When an identity view of a CustomEsiClient requests an authenticated method, the CustomEsiClient shall send the identity's current access token as the bearer.
    The builder's client gets the same views as EsiClient, over the domains it
    was built with.

    Scenario: A custom client's view sends its identity's token
      Given a custom client built with the "wallet" client
      And an identity view of the custom client for a character holding an access token
      And ESI reports the character's wallet balance
      When the custom client's identity view requests the character's wallet balance
      Then the request shall carry the header "Authorization" with the value "Bearer raw-access-token"

  Rule: When ESI answers 401 to an identity view whose identity can refresh, the EsiClient shall retry the request once with the refreshed token.
    A token manager refreshes through SSO; the view installs that refresh as
    the token provider its retry strategy calls after a 401.

    Scenario: A managed token rejected by ESI is refreshed through SSO and the request retried
      Given an EsiClient that holds no token
      And an identity view of the EsiClient for a character managed by a token manager
      And ESI rejects the character's token once and then reports the wallet balance
      And SSO issues the character a fresh token
      When the identity view requests the character's wallet balance
      Then the call shall resolve with the wallet balance after two requests
      And the request shall carry the character's fresh access token as the bearer

  # ── What the views share

  Rule: While an identity view shares an EsiClient, the EsiClient shall serve a public entry cached through the view to the client without a request.
    The view and the client it came from hold one ETag cache, so a public
    answer fetched once is fetched once for every character.

    Scenario: The server status fetched through a view is served to the client from the cache
      Given an EsiClient that holds no token
      And an identity view of the EsiClient for a character holding an access token
      And ESI reports the server status with an ETag
      When the identity view requests the server status
      And the EsiClient requests the server status
      Then the runtime shall have sent 1 request

  Rule: While two identity views share an EsiClient, the EsiClient shall keep each identity's authenticated entries apart.
    The cache keys an authenticated entry by the character the token names, so
    one character's corporation wallets are never another's answer.

    Scenario: A corporation wallet fetched by one character is not served to another
      Given an EsiClient that holds no token
      And identity views of the EsiClient for two characters of one corporation
      And ESI reports the corporation wallets twice
      When each identity view requests the corporation wallets
      Then the runtime shall have sent 2 requests

  # ── A view's identity is fixed

  Rule: If an access token is set on an identity view, then the EsiClient shall reject the call with a CONFIGURATION_ERROR.
    A view that could change its token would no longer be the identity it was
    asked for; `as()` with another identity is the way to another character.

    Scenario: Setting an access token on a view is refused
      Given an EsiClient that holds no token
      And an identity view of the EsiClient for a character holding an access token
      When an access token is set on the identity view
      Then the call shall be rejected with a configuration error
