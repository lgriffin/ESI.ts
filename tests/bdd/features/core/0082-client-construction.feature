@ARCH-14
Feature: Building custom clients and shutting them down
  Custom clients are built three ways: an `EsiClient` holding every domain,
  a `CustomEsiClient` from `EsiClientBuilder` holding the domains added to
  it, and one domain client from `EsiApiFactory.createClient`. Each applies
  the same settings from its config or the `ESI_*` environment variables,
  and each shutdown stops what the surface built and leaves what it was
  given. These Rules hold the three surfaces to the same settings, the same
  shutdown and the identity views, logging and caches they offer.

  Each client is built over the transport seam and logs to a recording
  logger; what reaches the seam shows which settings it applied.

  # ── Settings applied at construction

  Rule: Where a language, compatibility date or datasource is configured, every custom client construction surface shall send the setting with each request.

    Scenario Outline: A client built by <surface> configured with <setting> sends <what>
      Given a client built by <surface> configured with <setting>
      And ESI reports the server status
      When the built client reads the server status
      Then the request to ESI shall carry <what>

      Examples:
        | surface         | setting                             | what                                         |
        | EsiClient       | the language "de"                   | the header "accept-language" "de"            |
        | EsiClient       | the compatibility date "2020-01-01" | the header "x-compatibility-date" "2020-01-01" |
        | EsiClient       | the datasource "singularity"        | the query parameter "datasource" "singularity" |
        | EsiClientBuilder | the language "de"                   | the header "accept-language" "de"            |
        | EsiClientBuilder | the compatibility date "2020-01-01" | the header "x-compatibility-date" "2020-01-01" |
        | EsiClientBuilder | the datasource "singularity"        | the query parameter "datasource" "singularity" |
        | EsiApiFactory   | the language "de"                   | the header "accept-language" "de"            |
        | EsiApiFactory   | the compatibility date "2020-01-01" | the header "x-compatibility-date" "2020-01-01" |
        | EsiApiFactory   | the datasource "singularity"        | the query parameter "datasource" "singularity" |

  Rule: Where no base URL, client ID or datasource is configured, every custom client construction surface shall take the setting from ESI_BASE_URL, ESI_CLIENT_ID or ESI_DATASOURCE.

    Scenario Outline: A client built by <surface> takes its base URL and client ID from the environment
      Given the environment variable "ESI_BASE_URL" is "https://esi.example.test"
      And the environment variable "ESI_CLIENT_ID" is "env-tool/1.0"
      And a client built by <surface> configured with no base URL or client ID that allows a custom host
      And ESI reports the server status
      When the built client reads the server status
      Then the request to ESI shall have gone to the host "esi.example.test"
      And the request to ESI shall carry the header "x-user-agent" "env-tool/1.0"

      Examples:
        | surface         |
        | EsiClient       |
        | EsiClientBuilder |
        | EsiApiFactory   |

    Scenario: An EsiClient takes its datasource from the environment
      Given the environment variable "ESI_DATASOURCE" is "singularity"
      And a client built by EsiClient configured with no settings
      And ESI reports the server status
      When the built client reads the server status
      Then the request to ESI shall carry the query parameter "datasource" "singularity"

  Rule: Where a token refresh callback is configured, every custom client construction surface shall send an authenticated request again with the refreshed token after a 401.

    Scenario Outline: A client built by <surface> refreshes after a 401
      Given a client built by <surface> for the wallet configured with a token refresh callback answering "refreshed-token"
      And ESI rejects the next wallet request with status 401
      And ESI reports the character's wallet balance
      When the built client reads the character's wallet
      Then the last request to ESI shall carry the bearer token "refreshed-token"

      Examples:
        | surface         |
        | EsiClient       |
        | EsiClientBuilder |
        | EsiApiFactory   |

  Rule: When an EsiClient or CustomEsiClient is created, the client shall log what it was built with.

    Scenario: An EsiClient's startup line
      Given a client built by EsiClient configured with no settings
      Then the client shall have logged "EsiClient initialized successfully" with the context '{"baseUrl":"https://esi.evetech.net","clientId":"bdd-construction"}'

    Scenario: A CustomEsiClient's startup line
      Given a client built by EsiClientBuilder configured with no settings
      Then the client shall have logged "CustomEsiClient initialized with clients: status, wallet" with the context '{"clients":["status","wallet"]}'

  # ── Shutdown

  Rule: When a custom client shuts down, the client shall stop the ETag cache and circuit breaker the client built and drop the in-flight requests of the deduplicator the client built.

    Scenario Outline: A client built by <surface> that built every part
      Given a client built by <surface> configured with a circuit breaker
      And the client's circuit breaker holds a circuit
      And the client's deduplicator holds a request in flight
      When the built client shuts down
      Then the client shall have logged "ETag cache manager shut down"
      And the client's circuit breaker shall hold 0 circuits
      And the next request through the client's deduplicator shall be sent again

      Examples:
        | surface         |
        | EsiClient       |
        | EsiClientBuilder |
        | EsiApiFactory   |

  Rule: When a custom client shuts down, the client shall leave a supplied cache store, circuit breaker and deduplicator running.

    Scenario Outline: A client built by <surface> given every part
      Given a client built by <surface> given a cache store, a circuit breaker and a deduplicator
      And the client's circuit breaker holds a circuit
      And the client's deduplicator holds a request in flight
      When the built client shuts down
      Then the client shall not have logged "ETag cache manager shut down"
      And the supplied cache store shall not have been shut down
      And the client's circuit breaker shall hold 1 circuits
      And the next request through the client's deduplicator shall join the one in flight

      Examples:
        | surface         |
        | EsiClient       |
        | EsiClientBuilder |
        | EsiApiFactory   |

  Rule: When an EsiClient or CustomEsiClient shuts down, the client shall drop the domain clients it holds and log the shutdown.

    Scenario: An EsiClient builds its status client again after a shutdown
      Given a client built by EsiClient configured with no settings
      And the EsiClient's status client is noted
      When the built client shuts down
      Then the EsiClient's status client shall be a new one
      And the client shall have logged "EsiClient shutdown completed"

    Scenario: A CustomEsiClient holds no domain client after a shutdown
      Given a client built by EsiClientBuilder configured with no settings
      When the built client shuts down
      Then the CustomEsiClient shall hold no status client
      And the client shall have logged "CustomEsiClient shutdown completed"

  # ── Identity views

  Rule: When a view is asked for the same identity twice, the client shall return the same view.

    Scenario Outline: A client built by <surface> asked twice for one identity
      Given a client built by <surface> configured with no settings
      Then the views the client gives for one identity shall be the same object

      Examples:
        | surface         |
        | EsiClient       |
        | EsiClientBuilder |

  Rule: When a view made by as(identity) shuts down, the view shall leave the cache and circuit breaker of the client it came from running.

    Scenario Outline: A view from <surface> shuts down
      Given a client built by <surface> configured with a circuit breaker
      And the client's circuit breaker holds a circuit
      When a view of the client for one identity shuts down
      Then the client shall not have logged "ETag cache manager shut down"
      And the client's circuit breaker shall hold 1 circuits

      Examples:
        | surface         |
        | EsiClient       |
        | EsiClientBuilder |

  Rule: If a view made by as(identity) is given a token provider or an interceptor, then the EsiClient shall refuse with an EsiConfigurationError.

    Scenario Outline: A view refuses <call>
      Given a client built by EsiClient configured with no settings
      When <call> is called on a view of the EsiClient for one identity
      Then the call shall be refused with an EsiConfigurationError naming "<call>"

      Examples:
        | call                   |
        | setTokenProvider       |
        | addRequestInterceptor  |
        | addResponseInterceptor |

  Rule: When an EsiClient is given an interceptor, the EsiClient shall run the interceptor on its requests and responses.

    Scenario: A request and a response interceptor on the EsiClient
      Given a client built by EsiClient configured with no settings
      And the EsiClient adds a request interceptor setting the header "x-trace" to "t1"
      And the EsiClient adds a response interceptor counting responses
      And ESI reports the server status
      When the built client reads the server status
      Then the request to ESI shall carry the header "x-trace" "t1"
      And the response interceptor shall have counted 1 response

  # ── Tokens on an EsiClient

  Rule: When an EsiClient is given a token provider, the EsiClient shall send an authenticated request again with the provider's token after a 401 and log that the provider was configured.

    Scenario: A token provider set after construction
      Given a client built by EsiClient for the wallet configured with no settings
      And the EsiClient is given a token provider answering "provided-token"
      And ESI rejects the next wallet request with status 401
      And ESI reports the character's wallet balance
      When the built client reads the character's wallet
      Then the last request to ESI shall carry the bearer token "provided-token"
      And the client shall have logged "Token provider configured" with no context

  Rule: When an EsiClient's token provider is removed or its access token is replaced, the EsiClient shall log the change.

    Scenario: The provider is removed and the token replaced
      Given a client built by EsiClient configured with no settings
      When the EsiClient's token provider is removed
      And the EsiClient's access token is replaced
      Then the client shall have logged "Token provider removed" with no context
      And the client shall have logged "Access token updated" with no context

  # ── Diagnostics and caches

  Rule: The EsiClient shall reset the circuit of an endpoint it is asked to reset.

    Scenario: Resetting one circuit
      Given a client built by EsiClient configured with a circuit breaker
      And the client's circuit breaker holds a circuit
      When the EsiClient resets the circuit for the endpoint the circuit holds
      Then the client's circuit breaker shall hold 0 circuits

  Rule: The EsiClient shall return the same diagnostics object every time.

    Scenario: Diagnostics read twice
      Given a client built by EsiClient configured with no settings
      Then the EsiClient's diagnostics read twice shall be the same object

  Rule: The CustomEsiClient shall return one safe-mode view holding its enabled domain clients on every call.

    Scenario: The safe-mode view read twice
      Given a client built by EsiClientBuilder configured with no settings
      Then the CustomEsiClient's safe-mode views read twice shall be the same object holding a status client

  Rule: When a CustomEsiClient's cache is cleared or its cache limit changed, the CustomEsiClient shall apply the change to the ETag cache it built.

    Scenario: A cleared cache
      Given a client built by EsiClientBuilder configured with no settings
      And ESI reports the server status with an ETag
      And the built client reads the server status
      When the CustomEsiClient's cache is cleared
      Then the CustomEsiClient's cache shall hold 0 entries

    Scenario: A cache limit of 5 entries
      Given a client built by EsiClientBuilder configured with no settings
      When the CustomEsiClient's cache limit is set to 5 entries
      Then the CustomEsiClient's cache shall allow 5 entries

  # ── The default client and the builder

  Rule: The default EsiClient shall be built once per process.

    Scenario: The default client asked for twice
      Then the default EsiClient asked for twice shall be the same object

  Rule: The EsiClientBuilder shall hold each domain it is given once.

    Scenario: The status domain added twice
      When an EsiClientBuilder is given the status domain twice
      Then the built CustomEsiClient shall hold the domains "status"
      And the client shall have logged "CustomEsiClient initialized with clients: status" with the context '{"clients":["status"]}'

  Rule: If an EsiClientBuilder is given no domain, then the EsiClientBuilder shall refuse to build a client.

    Scenario: A builder given no domain
      When an EsiClientBuilder with no domain builds a client
      Then the build shall fail saying "At least one client type must be specified"
