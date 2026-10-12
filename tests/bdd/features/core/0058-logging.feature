@ARCH-09 @SEC-02 @SEC-10
Feature: Log redaction
  The pipeline writes the URL of each request to the logger an application
  configures, and an application may put a credential in a query string
  (an access token, an OAuth code, a client secret). Log lines travel further
  than the process: to files, aggregators and support tickets. Every line the
  per-client logger receives passes through the same redaction the error
  classes apply, at the logger boundary, so no call site can forget it.

  These scenarios drive the real request pipeline to the transport seam with
  a recording logger configured on the client and read what reached it.

  The console logger (`createConsoleLogger`) is the plain-text logger a script
  or an example configures instead of pino. Its scenarios capture what reaches
  console.log, console.warn and console.error, through a client or from the
  application's own log calls.

  @sec-P3
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

  @sec-P3 @TEST-11
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

  Rule: Where an application builds the console logger with a level, the console logger shall write only the lines at or above that level.
    `createConsoleLogger` is the plain-text logger for scripts and the
    examples. Its level is the only filter between a log call and the
    console, so a line below it never appears and `silent` writes nothing at
    all. The client is configured to pass every level to its logger, so what
    reaches the console is the console logger's own decision.

    Scenario: A console logger at info writes the client's request line
      Given a client that logs to the console at level "info"
      And ESI reports the server status
      When the client requests the server status
      Then standard output shall receive a line starting with "Hitting endpoint: https://esi.evetech.net/status [method=GET]"

    Scenario: A console logger at warn leaves the request line out
      Given a client that logs to the console at level "warn"
      And ESI reports the server status
      When the client requests the server status
      Then the console shall receive no line

    Scenario: A silent console logger writes not even a fatal line
      Given a console logger at level "silent"
      When the application logs "disk full" at level "fatal"
      Then the console shall receive no line

  Rule: When the console logger writes a line, the console logger shall send info and lower levels to standard output, warn to the warning stream, and error and fatal to the error stream, with every level but info prefixed by its name.
    A failure has to land on standard error, where a shell or a supervisor
    looks for it, while the program's ordinary output stays on standard
    output. The level prefix tells the lines apart once the streams are
    merged; info carries none, so a script's own output reads as written.

    Scenario: An info line goes to standard output as written
      Given a console logger at level "trace"
      When the application logs "Players online: 21000" at level "info"
      Then standard output shall receive the line "Players online: 21000"

    Scenario: A debug line goes to standard output with its level
      Given a console logger at level "trace"
      When the application logs "cache miss" at level "debug"
      Then standard output shall receive the line "debug: cache miss"

    Scenario: A warning goes to the warning stream
      Given a console logger at level "trace"
      When the application logs "slow response" at level "warn"
      Then the warning stream shall receive the line "warn: slow response"

    Scenario: An error goes to the error stream
      Given a console logger at level "trace"
      When the application logs "request failed" at level "error"
      Then the error stream shall receive the line "error: request failed"

    Scenario: A fatal line goes to the error stream
      Given a console logger at level "trace"
      When the application logs "cannot start" at level "fatal"
      Then the error stream shall receive the line "fatal: cannot start"

  Rule: When the console logger writes a line that carries context, the console logger shall append each context field as a [key=value] token, showing an error by its message and any other non-string value as JSON.
    `LogContext` promises structured fields; on a console they become
    plain-text tokens after the message, in the order the fields were given,
    so a line stays one line and greppable.

    Scenario: A failed request's context is appended as tokens
      Given a console logger at level "trace"
      When the application logs "request failed" with the status 503, the error "ESI is down" and the endpoints "status" and "wars"
      Then the error stream shall receive the line 'error: request failed [status=503] [cause=ESI is down] [endpoints=["status","wars"]]'

  Rule: Where the console logger is built without a level, the console logger shall take its level from ESI_LOG_LEVEL, or warn when that variable is unset or names no level.
    This is the resolution `createDefaultLogger` uses, so switching an
    application between the two loggers does not change which lines appear.
    An unknown value falls back rather than throwing, because a logger must
    not throw.

    Scenario: ESI_LOG_LEVEL at debug lets debug lines through
      Given a console logger built with no level while ESI_LOG_LEVEL is "debug"
      When the application logs "cache miss" at level "debug"
      Then standard output shall receive the line "debug: cache miss"

    Scenario: With ESI_LOG_LEVEL unset an info line is held back
      Given a console logger built with no level while ESI_LOG_LEVEL is unset
      When the application logs "Players online: 21000" at level "info"
      Then the console shall receive no line

    Scenario: With ESI_LOG_LEVEL unset a warning is written
      Given a console logger built with no level while ESI_LOG_LEVEL is unset
      When the application logs "slow response" at level "warn"
      Then the warning stream shall receive the line "warn: slow response"

    Scenario: An ESI_LOG_LEVEL that names no level falls back to warn
      Given a console logger built with no level while ESI_LOG_LEVEL is "verbose"
      When the application logs "Players online: 21000" at level "info"
      Then the console shall receive no line
