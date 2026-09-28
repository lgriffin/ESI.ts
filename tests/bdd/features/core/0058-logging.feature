Feature: Log redaction
  The pipeline writes the URL of each request to the logger an application
  configures, and an application may put a credential in a query string
  (an access token, an OAuth code, a client secret). Log lines travel further
  than the process: to files, aggregators and support tickets. Every line the
  per-client logger receives passes through the same redaction the error
  classes apply, at the logger boundary, so no call site can forget it.

  These scenarios drive the real request pipeline to the transport seam with
  a recording logger configured on the client and read what reached it.

  Rule: When the client logs a request whose URL carries a sensitive query parameter, the client logger shall receive that parameter with its value replaced by [REDACTED].
    The sensitive names are the ones `sanitizeUrl` redacts in an EsiError's
    url. The other parameters and the path are logged as sent, so a line still
    says which request it was about. Only the value of a sensitive parameter is
    withheld.

    Scenario: An access token in the query is logged redacted
      Given a client that logs to a recording logger and sends the query parameter "token" with the value "s3cret"
      And ESI reports the server status
      When the client requests the server status
      Then the logged request URL shall carry "token" with the value "[REDACTED]"
      And no logged line shall contain "s3cret"

    Scenario: A refresh token in the query is logged redacted
      Given a client that logs to a recording logger and sends the query parameter "refresh_token" with the value "r-9f2c"
      And ESI reports the server status
      When the client requests the server status
      Then the logged request URL shall carry "refresh_token" with the value "[REDACTED]"
      And no logged line shall contain "r-9f2c"

  Rule: If a request carries an access token, then the client logger shall not receive that token.
    The bearer token travels in the Authorization header, and no log call
    includes request headers, so the token has no path to a log line whatever
    the configured level. The scenarios record every level, on a call that
    succeeds and on one ESI refuses, and look for the token in each message
    and each string field of its context.

    Scenario: A wallet balance read leaves no token in the log
      Given a client that logs every level to a recording logger
      And an authenticated character for wallet
      When the client requests their wallet balance
      Then no logged line shall contain "bdd-access-token"

    Scenario: A wallet balance refused with HTTP 401 leaves no token in the log
      Given a client that logs every level to a recording logger
      And ESI rejects the character's token
      When the client requests their wallet balance and ESI refuses it
      Then no logged line shall contain "bdd-access-token"
