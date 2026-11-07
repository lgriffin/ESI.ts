@ARCH-08
Feature: Rate limiter token groups, blocks, error budget and pacing
  `RateLimiter` tracks ESI's rate-limit groups from the `X-Ratelimit-*`
  headers, honours `Retry-After` and the 420/429 back-off, waits while ESI's
  error budget is low, slows down as a group's tokens run out, and keeps a
  minimum gap between requests. 0061-rate-limit-status.feature specifies
  what a client reports from it. These Rules hold the limiter itself to each
  figure and each wait.

  The scenarios drive a real RateLimiter on a clock that moves forward by
  every wait the limiter asks for and records it. Responses are fed to the
  limiter as the pipeline feeds them, and each clearance is asked as the
  pipeline asks before a request. Template paths are written as the
  endpoint maps write them, without a leading slash.

  # ── Token cost

  Rule: The rate limiter shall cost a 2xx response 2 tokens, a 3xx 1, a 4xx 5, a 5xx 0 and any other status 2.
    These are ESI's published costs against a group's token bucket.

    Scenario Outline: Status <status> costs <cost> tokens
      Then the token cost of status <status> shall be <cost>

      Examples:
        | status | cost |
        | 199    | 2    |
        | 200    | 2    |
        | 299    | 2    |
        | 300    | 1    |
        | 399    | 1    |
        | 400    | 5    |
        | 499    | 5    |
        | 500    | 0    |
        | 599    | 0    |
        | 600    | 2    |

  # ── Groups

  Rule: When a response reports a group's tokens, the rate limiter shall file the counts under the group the endpoint map names for the template path.
    A template path is matched without its trailing slash and with its
    parameters in snake case, as the generated group table writes them.

    Scenario: The wallet path files its counts under char-wallet
      Given a rate limiter with a minimum delay of 0 ms
      When the limiter reads a 200 response to GET "characters/{characterId}/wallet/" with the headers "x-ratelimit-remaining=10, x-ratelimit-limit=150, x-ratelimit-used=140"
      Then the limiter shall report the group "char-wallet" with 10 of 150 tokens left and 140 used

  Rule: When a response names its group in X-Ratelimit-Group, the rate limiter shall file the counts under that group.

    Scenario: A group no endpoint map names
      Given a rate limiter with a minimum delay of 0 ms
      When the limiter reads a 200 response to GET "universe/unmapped/" with the headers "x-ratelimit-group=custom-group, x-ratelimit-remaining=5"
      Then the limiter shall report the group "custom-group" with 5 of 0 tokens left and 0 used

    Scenario: A named group that reports no counts
      Given a rate limiter with a minimum delay of 0 ms
      When the limiter reads a 200 response to GET "universe/unmapped/" with the headers "x-ratelimit-group=custom-group"
      Then the limiter shall report the group "custom-group" with -1 of 0 tokens left and 0 used

  Rule: Where an endpoint override is configured, the rate limiter shall keep a group of its own for the endpoint with the override's token count.

    Scenario: An override of 5 tokens for the server status
      Given a rate limiter with an override of 5 tokens for GET "status"
      When the limiter clears a request to GET "status/"
      Then the limiter shall report the group "endpoint:GET:status" with 5 of 5 tokens left and 0 used

  Rule: The rate limiter shall report no group, -1 tokens left and a limit of 0 before any response reports a group.

    Scenario: A new limiter
      Given a rate limiter with a minimum delay of 0 ms
      Then the limiter status shall report no group with -1 of 0 tokens left

  # ── Retry-After and the 420/429 back-off

  Rule: When a response carries Retry-After as whole seconds or an HTTP date, the rate limiter shall block the response's group until then.

    Scenario Outline: Retry-After "<value>" blocks the status group until <until>
      Given a rate limiter with a minimum delay of 0 ms
      When the limiter reads a 200 response to GET "status/" with the headers "retry-after=<value>"
      Then the limiter status shall report the group blocked until <until>

      Examples:
        | value                         | until                            |
        | 30                            | 30000 ms after the clock start   |
        | 2099-01-01T00:00:00Z          | 4070908800000 ms                 |
        | Thu, 01 Jan 2099 00:00:00 GMT | 4070908800000 ms                 |

  Rule: If a response carries a Retry-After that is neither whole seconds nor an HTTP date, then the rate limiter shall not block the group.

    Scenario Outline: Retry-After "<value>" is ignored
      Given a rate limiter with a minimum delay of 0 ms
      When the limiter reads a 200 response to GET "status/" with the headers "x-ratelimit-remaining=500, retry-after=<value>"
      Then the limiter shall report the group "status" blocked until 0

      Examples:
        | value      |
        | 30x        |
        | a30        |
        | 2099-01-01 |

  Rule: When a response has status 420 or 429 while no Retry-After block is in force, the rate limiter shall block the group for 60 seconds.
    A Retry-After on the same response sets the block instead, shorter or
    longer.

    Scenario Outline: A <status> with Retry-After 0 blocks for 60 seconds
      Given a rate limiter with a minimum delay of 0 ms
      When the limiter reads a <status> response to GET "status/" with the headers "retry-after=0"
      Then the limiter status shall report the group blocked until 60000 ms after the clock start
      And the limiter status shall report a retry after 60 seconds

      Examples:
        | status |
        | 420    |
        | 429    |

    Scenario Outline: A 429 with Retry-After <seconds> blocks for <seconds> seconds
      Given a rate limiter with a minimum delay of 0 ms
      When the limiter reads a 429 response to GET "status/" with the headers "retry-after=<seconds>"
      Then the limiter status shall report the group blocked until <ms> ms after the clock start

      Examples:
        | seconds | ms     |
        | 30      | 30000  |
        | 120     | 120000 |

  Rule: While a group is blocked, the rate limiter shall hold a request to the group until the block ends and log the wait.

    Scenario: A request 10 seconds into a 30 second block waits 20 seconds
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "retry-after=30"
      And the limiter clock moves on 10000 ms
      When the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "20000"
      And the limiter shall have warned "[ESI Rate Limit] Group 'status' blocked for 20s (420/429 received)" with the context '{"group":"status","waitMs":20000}'
      And the limiter shall report the group "status" blocked until 0

    Scenario: A request at the end of a block is not held
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "retry-after=30"
      And the limiter clock moves on 30000 ms
      When the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "none"
      And the limiter status shall report no retry after

  Rule: If a response extends a group's block while a request waits, then the rate limiter shall hold the request until the extended block ends.

    Scenario: A block extended once
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "retry-after=30"
      And a response to GET "status/" with Retry-After 60 arrives during the next wait
      When the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "30000, 60000"

  Rule: If a group is still blocked after 10 waits, then the rate limiter shall refuse the request with a 429 EsiError instead of sending it.

    Scenario: A block extended during every wait
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "retry-after=30"
      And a response to GET "status/" with Retry-After 60 arrives during every wait
      When the limiter clears a request to GET "status/"
      Then the limiter shall have waited 10 times
      And the clearance shall be refused with status 429 saying "Rate limit group 'status' still blocked for 60s"
      And the limiter shall have warned "[ESI Rate Limit] Group 'status' still blocked after retry budget exhausted; aborting request instead of sending while blocked" with the context '{"group":"status"}'

  Rule: While test mode is on, the rate limiter shall neither read responses nor hold requests.

    Scenario: A blocked group in test mode
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 429 response to GET "status/" with the headers "retry-after=30"
      And the limiter is in test mode
      When the limiter reads a 200 response to GET "status/" with the headers "x-ratelimit-remaining=7"
      And the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "none"
      And the limiter shall report the group "status" with 600 of 600 tokens left and 0 used

  # ── Blocked groups

  Rule: The rate limiter shall report a named group as blocked only while the group's block has not ended.

    Scenario: The status group is blocked and the wallet group is not
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "characters/{characterId}/wallet/" with the headers "x-ratelimit-remaining=100"
      And the limiter has read a 200 response to GET "status/" with the headers "retry-after=30"
      Then the limiter shall report the group "status" as blocked
      And the limiter shall report the group "char-wallet" as not blocked
      And the limiter shall report the group "unknown-group" as not blocked
      And the limiter shall report itself as blocked

    Scenario: At the end of the block
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "retry-after=30"
      And the limiter clock moves on 30000 ms
      Then the limiter shall report the group "status" as not blocked
      And the limiter shall report itself as not blocked

  Rule: While a request to a path no group covers is blocked, the rate limiter shall report itself as blocked.

    Scenario: A 429 on an unmapped path
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 429 response to GET "universe/unmapped/" with the headers "retry-after=30"
      Then the limiter shall report itself as blocked
      When the limiter clock moves on 30000 ms
      Then the limiter shall report itself as not blocked

  # ── The error budget

  Rule: When a response reports the error budget, the rate limiter shall report the errors left and the seconds to the reset.

    Scenario: 75 errors left with 42 seconds to the reset
      Given a rate limiter with a minimum delay of 0 ms
      When the limiter reads a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=75, x-esi-error-limit-reset=42"
      Then the limiter status shall report 75 errors left and a reset in 42 seconds

    Scenario: Headers read without a status
      Given a rate limiter with a minimum delay of 0 ms
      When the limiter reads the headers "x-esi-error-limit-remain=60, x-esi-error-limit-reset=12"
      Then the limiter status shall report 60 errors left and a reset in 12 seconds

  Rule: If a response reporting errors left arrives inside the window of a budget reported as exhausted, then the rate limiter shall keep the budget exhausted.
    The response was processed before the one that exhausted the budget and
    arrived late.

    Scenario: A late report 10 seconds into a 30 second window
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=0, x-esi-error-limit-reset=30"
      And the limiter clock moves on 10000 ms
      When the limiter reads a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=50, x-esi-error-limit-reset=20"
      Then the limiter status shall report 0 errors left and a reset in 30 seconds

    Scenario: A second exhausted report inside the window moves the reset
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=0, x-esi-error-limit-reset=30"
      And the limiter clock moves on 10000 ms
      When the limiter reads a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=0, x-esi-error-limit-reset=20"
      Then the limiter status shall report 0 errors left and a reset in 20 seconds

  Rule: When the window of an exhausted error budget has ended, the rate limiter shall accept a report of errors left.

    Scenario: A report at the end of a 30 second window
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=0, x-esi-error-limit-reset=30"
      And the limiter clock moves on 30000 ms
      When the limiter reads a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=100, x-esi-error-limit-reset=60"
      Then the limiter status shall report 100 errors left and a reset in 60 seconds

  Rule: While 1 to 10 errors are left in the budget, the rate limiter shall hold each request for the time to the reset, up to 5 seconds.

    Scenario Outline: <remain> errors left with <reset> seconds to the reset waits <waits>
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=<remain>, x-esi-error-limit-reset=<reset>"
      When the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "<waits>"

      Examples:
        | remain | reset | waits |
        | 5      | 3     | 3000  |
        | 10     | 3     | 3000  |
        | 1      | 20    | 5000  |
        | 5      | 0     | none  |
        | 11     | 3     | none  |
        | 50     | 30    | none  |

    Scenario: The low-budget wait is logged
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=5, x-esi-error-limit-reset=3"
      When the limiter clears a request to GET "status/"
      Then the limiter shall have warned "[ESI Rate Limit] Legacy error limit low (5), waiting 3000ms" with the context '{"errorLimitRemain":5}'

  Rule: While the error budget is exhausted, the rate limiter shall hold each request until the reset.

    Scenario: An exhausted budget with 30 seconds to the reset
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=0, x-esi-error-limit-reset=30"
      When the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "30000"
      And the limiter shall have warned "[ESI Rate Limit] Legacy error limit exhausted, waiting 30s" with the context '{"errorLimitReset":30}'

    Scenario: An exhausted budget with no reset reported
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "x-esi-error-limit-remain=0, x-esi-error-limit-reset=0"
      When the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "none"

  # ── Slowing down as tokens run out

  Rule: When a group has no tokens left, the rate limiter shall hold a request to the group for 1 second and log the wait.

    Scenario: The status group at 0 of 600
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "x-ratelimit-remaining=0, x-ratelimit-limit=600"
      When the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "1000"
      And the limiter shall have warned "[ESI Rate Limit] Group 'status' token bucket empty, waiting 1s" with the context '{"group":"status"}'

  Rule: While the share of a group's tokens left is at or under the deceleration threshold, the rate limiter shall hold a request by 1 second times the share of the threshold already used.

    Scenario Outline: <remaining> of 600 tokens left waits <waits>
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "status/" with the headers "x-ratelimit-remaining=<remaining>, x-ratelimit-limit=600"
      When the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "<waits>"

      Examples:
        | remaining | waits |
        | 60        | 500   |
        | 120       | 0     |
        | 300       | none  |

  Rule: If a group's tokens left or limit are unknown, then the rate limiter shall not hold a request for the group's tokens.

    Scenario Outline: An unmapped path reporting only <headers>
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "universe/unmapped/" with the headers "<headers>"
      When the limiter clears a request to GET "universe/unmapped/"
      Then the limiter's waits shall be "none"

      Examples:
        | headers                 |
        | x-ratelimit-limit=100   |
        | x-ratelimit-remaining=0 |

  # ── The minimum gap between requests

  Rule: The rate limiter shall hold a request until the minimum delay has passed since the previous request.

    Scenario Outline: A request <since> ms after the previous one waits <waits>
      Given a rate limiter with a minimum delay of 100 ms
      And the limiter has cleared a request to GET "status/"
      And the limiter clock moves on <since> ms
      When the limiter clears a request to GET "status/"
      Then the limiter's waits shall be "<waits>"

      Examples:
        | since | waits |
        | 0     | 100   |
        | 40    | 60    |
        | 100   | none  |

  # ── The status it reports

  Rule: The rate limiter shall report the group with the smallest share of tokens left, the first of equal shares.

    Scenario Outline: <first> then <second> reports <worst>
      Given a rate limiter with a minimum delay of 0 ms
      And the limiter has read a 200 response to GET "<first path>" with the headers "<first headers>"
      And the limiter has read a 200 response to GET "<second path>" with the headers "<second headers>"
      Then the limiter status shall report the group "<worst>"

      Examples:
        | first       | second      | first path                        | first headers                                      | second path        | second headers                                     | worst       |
        | char-wallet | status      | characters/{characterId}/wallet/  | x-ratelimit-remaining=15, x-ratelimit-limit=150    | status/            | x-ratelimit-remaining=300, x-ratelimit-limit=600   | char-wallet |
        | char-wallet | status      | characters/{characterId}/wallet/  | x-ratelimit-remaining=120, x-ratelimit-limit=150   | status/            | x-ratelimit-remaining=60, x-ratelimit-limit=600    | status      |
        | char-wallet | status      | characters/{characterId}/wallet/  | x-ratelimit-remaining=75, x-ratelimit-limit=150    | status/            | x-ratelimit-remaining=300, x-ratelimit-limit=600   | char-wallet |
        | status      | quiet-group | status/                           | x-ratelimit-remaining=300, x-ratelimit-limit=600   | universe/unmapped/ | x-ratelimit-group=quiet-group                      | status      |

  # ── Buckets per user

  Rule: Where buckets are kept per user, the rate limiter shall hold a user's request only for that user's own group tokens.

    Scenario: One user's empty group does not hold another user
      Given a rate limiter that keeps buckets per user
      And the limiter has read a 200 response to GET "status/" for the user "alice" with the headers "x-ratelimit-remaining=0, x-ratelimit-limit=600"
      When the limiter clears a request to GET "status/" for the user "bob"
      Then the limiter's waits shall be "none"
      When the limiter clears a request to GET "status/" for the user "alice"
      Then the limiter's waits shall be "1000"

    Scenario: The status reports a user's group
      Given a rate limiter that keeps buckets per user
      And the limiter has read a 200 response to GET "status/" for the user "alice" with the headers "x-ratelimit-remaining=10, x-ratelimit-limit=600"
      Then the limiter status shall report the group "status"

  Rule: When a user's buckets have not been used for more than 15 minutes, the rate limiter shall drop the buckets at its next clean-up, which runs no sooner than 1 minute after the previous one.

    Scenario: A user idle for 15 minutes and 1 ms is dropped
      Given a rate limiter that keeps buckets per user
      And the limiter has read a 200 response to GET "status/" for the user "alice" with the headers "x-ratelimit-remaining=0, x-ratelimit-limit=600"
      And the limiter clock moves on 900001 ms
      When the limiter clears a request to GET "status/" for the user "alice"
      Then the limiter's waits shall be "none"

    Scenario: A user idle for exactly 15 minutes is kept
      Given a rate limiter that keeps buckets per user
      And the limiter has read a 200 response to GET "status/" for the user "alice" with the headers "x-ratelimit-remaining=0, x-ratelimit-limit=600"
      And the limiter clock moves on 900000 ms
      When the limiter clears a request to GET "status/" for the user "alice"
      Then the limiter's waits shall be "1000"

    Scenario: Another user's request does not drop a user in use
      Given a rate limiter that keeps buckets per user
      And the limiter has read a 200 response to GET "status/" for the user "alice" with the headers "x-ratelimit-remaining=0, x-ratelimit-limit=600"
      And the limiter has cleared a request to GET "status/" for the user "bob"
      When the limiter clears a request to GET "status/" for the user "alice"
      Then the limiter's waits shall be "1000"

    Scenario: A clean-up 1 minute after the last one drops an idle user
      Given a rate limiter that keeps buckets per user
      And the limiter has read a 200 response to GET "status/" for the user "alice" with the headers "x-ratelimit-remaining=0, x-ratelimit-limit=600"
      And the limiter clock moves on 840001 ms
      And the limiter has cleared a request to GET "status/" for the user "bob"
      And the limiter clock moves on 60000 ms
      When the limiter clears a request to GET "status/" for the user "alice"
      Then the limiter's waits shall be "none"

    Scenario: No clean-up within a minute of the last one
      Given a rate limiter that keeps buckets per user
      And the limiter has read a 200 response to GET "status/" for the user "alice" with the headers "x-ratelimit-remaining=0, x-ratelimit-limit=600"
      And the limiter clock moves on 899999 ms
      And the limiter has cleared a request to GET "status/" for the user "bob"
      And the limiter clock moves on 2 ms
      When the limiter clears a request to GET "status/" for the user "alice"
      Then the limiter's waits shall be "1000"
