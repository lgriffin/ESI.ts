@ARCH-08
Feature: Runtime options, views and shutdown
  `createEsi` builds one runtime from its options: the User-Agent it must be
  given, the datasource, language and compatibility date it sends with every
  request, and the cache and circuit breaker it builds unless the application
  supplies its own. 0056-shared-runtime.feature covers views and supplied
  middleware; this file covers the options themselves, the view cache, and
  what shutting the runtime down stops.

  The scenarios build the runtime with the seam transport and read the
  requests it sends.

  Rule: If the runtime is created with an empty User-Agent, then createEsi shall throw an EsiConfigurationError saying a User-Agent is required.
    ESI asks every caller to name itself, and an empty header names no one.

    Scenario: An empty User-Agent is refused
      When a runtime is created for the application ""
      Then the creation shall throw an EsiConfigurationError "VALIDATION_ERROR" saying "userAgent is required"

  Rule: Where the runtime is created with a datasource, the runtime shall send that datasource with every request.
    The datasource picks the server ESI answers for, such as Singularity
    for a test application.

    Scenario: The datasource travels with the request
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with the datasource "singularity"
      And ESI reports the server status
      When the public view requests the server status
      Then the request to ESI shall carry the query parameter "datasource" with the value "singularity"

  Rule: Where the runtime is created with a language, the runtime shall send that language as Accept-Language with every request.
    ESI translates names and descriptions into the language asked for.

    Scenario: The language travels as Accept-Language
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with the language "de"
      And ESI reports the server status
      When the public view requests the server status
      Then the request to ESI shall carry the header "accept-language" with the value "de"

  Rule: Where the runtime is created with a compatibility date, the runtime shall send that date as X-Compatibility-Date with every request.
    The date pins the response shapes an application was written against.

    Scenario: The compatibility date travels as X-Compatibility-Date
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with the compatibility date "2025-08-26"
      And ESI reports the server status
      When the public view requests the server status
      Then the request to ESI shall carry the header "x-compatibility-date" with the value "2025-08-26"

  Rule: If an authenticated operation is invoked on the public view, then the runtime's refusal shall name the scopes the operation needs and say to call it through esi.as(identity).
    The refusal is the guard for a caller who casts past the public view's
    type, and its message is the fix.

    Scenario: The refusal says which scope and where to call it
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      When an authenticated wallet request is forced through the public view
      Then the refusal shall name "esi-wallet.read_character_wallet.v1" and say "call it through esi.as(identity)"

  Rule: When the application asks the runtime for a view of the same identity twice, the runtime shall return the same view object.
    A view is cheap to keep and costly to rebuild, and code that compares
    views by identity expects one per identity.

    Scenario: The same identity gets the same view
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      When the application asks the runtime for a view of one identity twice
      Then both views shall be the same object

  Rule: When the application clears the runtime's cache, the runtime shall send the next request for a cached response to ESI.
    Clearing is how an application drops data it knows to be stale before
    its lifetime ends.

    Scenario: The server status is requested again after the cache is cleared
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI reports the server status with an ETag to the next 2 requests
      When the public view requests the server status
      And the runtime's cache is cleared
      And the public view requests the server status
      Then the runtime shall have sent 2 requests

  Rule: When the runtime shuts down, the runtime shall stop the cache it built.
    The built cache runs a cleanup timer; shutting down stops it, and the
    cache logs that it did.

    Scenario: Shutting down stops the built cache
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" that logs to a recording logger
      When the runtime shuts down
      Then the runtime's logger shall have received the "info" line "ETag cache manager shut down"

  Rule: When the runtime shuts down, the runtime shall clear the circuit breaker it built.
    The built breaker belongs to the runtime, so its circuits go with it.

    Scenario: Shutting down clears the built breaker's circuits
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a circuit breaker that opens after 2 failures
      And a view for a character holding an access token
      And ESI answers the server status with 500 until the circuit opens
      When the character's view requests the server status and the circuit opens
      And the runtime shuts down
      Then the runtime's circuit breaker statistics shall report no circuits

  Rule: Where a circuit breaker is supplied, the runtime shall leave that circuit breaker's circuits as they are when it shuts down.
    A supplied breaker may be shared with other runtimes, so only the
    application that supplied it decides when to clear it.

    Scenario: Shutting down keeps a supplied breaker's open circuit
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a supplied circuit breaker that opens after 2 failures
      And a view for a character holding an access token
      And ESI answers the server status with 500 until the circuit opens
      When the character's view requests the server status and the circuit opens
      And the runtime shuts down
      Then the supplied circuit breaker shall report 1 open circuit
