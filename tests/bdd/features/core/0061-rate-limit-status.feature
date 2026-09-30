Feature: Rate-limit status
  ESI meters most routes by rate-limit group: each response names its group
  and says how many tokens of the group's budget are left, and a 420 or 429
  says how long the group is closed. The rate limiter keeps what the last
  response said per group, and an application reads it back to pace its own
  work or to show why calls are waiting.

  These scenarios send requests through the real pipeline with a rate limiter
  attached, answer them at the transport seam, and read the limiter's status.

  Rule: When a response reports the tokens left in its rate-limit group, the RateLimiter shall report those counts for that group.
    The status comes from the headers ESI sent, not from the limiter's own
    estimate, so it matches what ESI will enforce on the next request.

    Scenario: The status group's token counts come from the response headers
      Given a request pipeline with a rate limiter and no retries
      And ESI reports the server status with 140 of 150 tokens left in the "status" group
      When the pipeline requests the server status
      Then the rate limiter shall report 140 of 150 tokens left and 10 used in the "status" group
      And the rate limiter shall report no rate-limit group blocked

  Rule: While a rate-limit group is closed by a Retry-After, the RateLimiter shall report that group and the limiter as blocked until the Retry-After ends.
    A caller that checks before calling can wait out the block instead of
    queueing requests the limiter would only hold back.

    Scenario: A 429 with Retry-After closes the status group for 30 seconds
      Given a request pipeline with a rate limiter and no retries
      And ESI answers the server status with HTTP 429 and a Retry-After of 30 seconds in the "status" group
      When the pipeline requests the server status
      Then the rate limiter shall report the "status" group blocked for 30 seconds
