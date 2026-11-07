@ARCH-14
Feature: Domain client page helpers, views and lifecycle
  Every domain client extends BaseEsiClient. Beside one method per route, a
  paged route has a fetchAll helper that collects every page, and every client
  has withMetadata and withSafeMode views and a shutdown. These Rules hold each
  helper to its route, the shared machinery to its contract, and the few
  methods that check an argument before the wire to their limit.

  # ── Every fetch-all helper

  Rule: When a domain client's fetch-all helper is called, the domain client shall request its route once for a one-page answer and resolve with that page's items.
    Each helper is a one-line call into the shared page walker; a helper that
    lost that line would resolve with nothing at all. Every helper the
    domain clients ship is listed here.

    Scenario Outline: The <client> client's <helper> collects a one-page answer
      Given ESI answers the next request with one empty page
      When the <client> client's <helper> helper collects with the identifiers "<identifiers>"
      Then the helper shall resolve with an empty list after 1 request

      Examples:
        | client       | helper                                 | identifiers          |
        | alliance     | fetchAllAlliances                      | -                    |
        | alliance     | fetchAllCorporations                   | 99000006             |
        | assets       | fetchAllCharacterAssets                | 2112625428           |
        | assets       | fetchAllCorporationAssets              | 98000001             |
        | calendar     | fetchAllCalendarEvents                 | 2112625428           |
        | calendar     | fetchAllEventAttendees                 | 2112625428, 4        |
        | characters   | fetchAllCharacterAgentsResearch        | 2112625428           |
        | characters   | fetchAllCharacterBlueprints            | 2112625428           |
        | characters   | fetchAllCharacterCorporationHistory    | 2112625428           |
        | characters   | fetchAllCharacterMedals                | 2112625428           |
        | characters   | fetchAllCharacterNotifications         | 2112625428           |
        | characters   | fetchAllCharacterNotificationsContacts | 2112625428           |
        | characters   | fetchAllCharacterStandings             | 2112625428           |
        | characters   | fetchAllCharacterTitles                | 2112625428           |
        | skills       | fetchAllCharacterSkillQueue            | 2112625428           |
        | clones       | fetchAllImplants                       | 2112625428           |
        | contacts     | fetchAllAllianceContactLabels          | 99000006             |
        | contacts     | fetchAllAllianceContacts               | 99000006             |
        | contacts     | fetchAllCharacterContactLabels         | 2112625428           |
        | contacts     | fetchAllCharacterContacts              | 2112625428           |
        | contacts     | fetchAllCorporationContactLabels       | 98000001             |
        | contacts     | fetchAllCorporationContacts            | 98000001             |
        | contracts    | fetchAllCharacterContracts             | 2112625428           |
        | contracts    | fetchAllCorporationContracts           | 98000001             |
        | contracts    | fetchAllPublicContracts                | 10000002             |
        | corporations | fetchAllCorporationAllianceHistory     | 98000001             |
        | corporations | fetchAllCorporationAlscLogs            | 98000001             |
        | corporations | fetchAllCorporationBlueprints          | 98000001             |
        | corporations | fetchAllCorporationFacilities          | 98000001             |
        | corporations | fetchAllCorporationIssuedMedals        | 98000001             |
        | corporations | fetchAllCorporationMedals              | 98000001             |
        | corporations | fetchAllCorporationMemberTitles        | 98000001             |
        | corporations | fetchAllCorporationMemberTracking      | 98000001             |
        | corporations | fetchAllCorporationMembers             | 98000001             |
        | corporations | fetchAllCorporationRoles               | 98000001             |
        | corporations | fetchAllCorporationRolesHistory        | 98000001             |
        | corporations | fetchAllCorporationShareholders        | 98000001             |
        | corporations | fetchAllCorporationStandings           | 98000001             |
        | corporations | fetchAllCorporationStarbases           | 98000001             |
        | corporations | fetchAllCorporationStructures          | 98000001             |
        | corporations | fetchAllCorporationTitles              | 98000001             |
        | corporations | fetchAllNpcCorporations                | -                    |
        | fittings     | fetchAllFittings                       | 2112625428           |
        | fleets       | fetchAllFleetMembers                   | 1234567890           |
        | fleets       | fetchAllFleetWings                     | 1234567890           |
        | industry     | fetchAllCharacterIndustryJobs          | 2112625428           |
        | industry     | fetchAllCharacterMiningLedger          | 2112625428           |
        | industry     | fetchAllCorporationIndustryJobs        | 98000001             |
        | industry     | fetchAllCorporationMiningObserver      | 98000001, 1031000000 |
        | industry     | fetchAllCorporationMiningObservers     | 98000001             |
        | industry     | fetchAllIndustryFacilities             | -                    |
        | industry     | fetchAllIndustrySystems                | -                    |
        | industry     | fetchAllMoonExtractionTimers           | 98000001             |
        | killmails    | fetchAllCharacterRecentKillmails       | 2112625428           |
        | killmails    | fetchAllCorporationRecentKillmails     | 98000001             |
        | loyalty      | fetchAllLoyaltyPoints                  | 2112625428           |
        | loyalty      | fetchAllLoyaltyStoreOffers             | 98000001             |
        | mail         | fetchAllMailHeaders                    | 2112625428           |
        | mail         | fetchAllMailingLists                   | 2112625428           |
        | market       | fetchAllCharacterOrderHistory          | 2112625428           |
        | market       | fetchAllCorporationOrderHistory        | 98000001             |
        | market       | fetchAllCorporationOrders              | 98000001             |
        | market       | fetchAllMarketOrdersInStructure        | 1035466617946        |
        | pi           | fetchAllColonies                       | 2112625428           |
        | pi           | fetchAllCorporationCustomsOffices      | 98000001             |
        | wallet       | fetchAllCharacterWalletJournal         | 2112625428           |
        | wallet       | fetchAllCharacterWalletTransactions    | 2112625428           |
        | wallet       | fetchAllCorporationWalletJournal       | 98000001, 1          |
        | wallet       | fetchAllCorporationWalletTransactions  | 98000001, 1          |
        | wars         | fetchAllWarKillmails                   | 615476               |
        | wars         | fetchAllWars                           | -                    |

  # ── What the shared helpers refuse and accept

  Rule: If a route answers a text document, then the domain client's fetch-all and stream helpers shall refuse it with a TypeError before any request.
    A text document has no pages; the helpers say so rather than send a
    request whose answer they cannot walk.

    Scenario Outline: The OpenAPI YAML document is refused by the <helper> helper
      When the meta client's <helper> helper is called for the OpenAPI YAML document
      Then the call shall be rejected with a TypeError saying "cannot be paged"
      And no request shall have been sent

      Examples:
        | helper    |
        | fetch-all |
        | stream    |

  Rule: If a route not marked as answering without content is answered with an empty body, then the domain client's fetch-all and stream helpers shall reject with a parse error.
    Only routes ESI documents as answering without content may read an
    empty body as an empty list; anywhere else it is a broken answer.

    Scenario Outline: An empty market orders body is refused by the <helper> helper
      Given ESI answers the next request with an empty body
      When the market client's <helper> helper collects the orders of The Forge
      Then the call shall be rejected with an EsiParseError

      Examples:
        | helper    |
        | fetch-all |
        | stream    |

  # ── Views

  Rule: When withMetadata or withSafeMode is called twice on a domain client, the domain client shall return the same view both times.
    A view is built once and kept, so an application can hold it or ask for
    it on every call at the same cost.

    Scenario Outline: The <view> view of the status client is built once
      When the status client's <view> view is asked for twice
      Then both answers shall be the same view

      Examples:
        | view         |
        | withMetadata |
        | withSafeMode |

  # ── Shutdown

  Rule: When a domain client built by EsiApiFactory.createClient is shut down, the domain client shall log that its shutdown completed.
    Such a client owns its pipeline, so its shutdown is the one that stops
    the pipeline's timers, and the log line is the record that it did.

    Scenario: A factory status client logs its shutdown
      Given a "status" client built by EsiApiFactory.createClient with a recording logger
      When the factory client is shut down
      Then the factory client's logger shall have received "Domain client shutdown completed"

  Rule: When a domain client reached through an EsiClient is shut down, the domain client shall leave the shared pipeline running and log nothing.
    The EsiClient owns that pipeline; one domain client must not stop it for
    the others.

    Scenario: The status client of an EsiClient does nothing on shutdown
      Given a client that logs every level to a recording logger
      And ESI reports the server status
      When the client's status client is shut down and the client then requests the server status
      Then the call shall resolve with the server status
      And the client's logger shall have received no shutdown line

  # ── Argument checks

  Rule: If a fleet squad or wing name is longer than 10 characters, then the Fleet client shall reject the rename without a request.
    ESI refuses a longer name; the client refuses it first and says why.

    Scenario Outline: An 11-character <unit> name is refused
      When the fleet client renames a <unit> to "Eleven Char"
      Then the call shall be rejected with an Error saying "exceeds ESI maximum of 10 characters"
      And no request shall have been sent

      Examples:
        | unit  |
        | squad |
        | wing  |

  Rule: When a fleet squad or wing name is 10 characters or fewer, the Fleet client shall send the rename.
    10 characters is the longest name ESI accepts.

    Scenario Outline: A 10-character <unit> name is sent
      Given ESI accepts the next request with no content
      When the fleet client renames a <unit> to "Ten Chars!"
      Then the call shall resolve with no body after 1 request

      Examples:
        | unit  |
        | squad |
        | wing  |
