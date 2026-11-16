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

  Rule: When a function is a context field of a line the console logger writes, the console logger shall show it as [function <name>], or [function anonymous] when it has no name.
    A function has no JSON form, and its source would flood the line. Its
    name is enough to tell which callback a line is about.

    Scenario: A named callback is shown by its name
      Given a console logger at level "trace"
      When the application logs "refresh scheduled" with a callback named "onRefresh"
      Then standard output shall receive the line "refresh scheduled [callback=[function onRefresh]]"

    Scenario: An anonymous callback is shown as anonymous
      Given a console logger at level "trace"
      When the application logs "refresh scheduled" with an anonymous callback
      Then standard output shall receive the line "refresh scheduled [callback=[function anonymous]]"

  # ── The library's log functions and the global logger ──────────────

  @sec-P3
  Rule: When the application logs through the library's log functions, the global logger shall receive the line with the value of every sensitive query parameter in its message and in its context replaced by [REDACTED].
    `logInfo`, `logWarn` and the rest write to the logger installed with
    `setLogger`, through the same redaction as the per-client logger. A URL
    can sit in the message or in a string field of the context, so both are
    redacted; other parameters, other fields and the rest of the text keep
    their exact wording. A sensitive parameter written with no value has
    nothing to withhold and is logged as written.

    Scenario: A token in the message and a code in the context are redacted
      Given the global logger is a recording logger
      When the application logs "GET https://esi.evetech.net/status?token=s3cret&page=2" at level "warn" through the library with the context:
        """
        { "url": "https://esi.evetech.net/status?code=c0de&page=2", "status": 200 }
        """
      Then the global logger shall receive only the "warn" line "GET https://esi.evetech.net/status?token=%5BREDACTED%5D&page=2"
      And the line shall carry the context:
        """
        { "url": "https://esi.evetech.net/status?code=%5BREDACTED%5D&page=2", "status": 200 }
        """
      And no logged line shall contain "s3cret"
      And no logged line shall contain "c0de"

    Scenario: A sensitive parameter with no value is logged as written
      Given the global logger is a recording logger
      When the application logs "GET https://esi.evetech.net/status?token=&page=2" at level "info" through the library
      Then the global logger shall receive only the "info" line "GET https://esi.evetech.net/status?token=&page=2"

  @sec-P3
  Rule: When the application logs a form body or a JSON body that carries a credential through the library's log functions, the global logger shall receive the line with the value of that credential replaced by [REDACTED].
    A token reaches log text outside a URL too: an OAuth form body
    (`grant_type=refresh_token&refresh_token=…`) or an SSO token response
    (`{"access_token": "…"}`). The names are the ones `sanitizeUrl` redacts.
    A form field keeps the URL-encoded marker a query parameter gets; a JSON
    member keeps its quotes, so the line still parses. Every other field and
    the rest of the text keep their exact wording.

    Scenario: A refresh token in a form body is logged redacted
      Given the global logger is a recording logger
      When the application logs "POST /v2/oauth/token grant_type=refresh_token&refresh_token=r-9f2c" at level "warn" through the library
      Then the global logger shall receive only the "warn" line "POST /v2/oauth/token grant_type=refresh_token&refresh_token=%5BREDACTED%5D"
      And no logged line shall contain "r-9f2c"

    Scenario: An access token in a JSON token response is logged redacted
      Given the global logger is a recording logger
      When the application logs 'token response {"access_token":"a-77e1","token_type":"Bearer"}' at level "warn" through the library
      Then the global logger shall receive only the "warn" line 'token response {"access_token":"[REDACTED]","token_type":"Bearer"}'
      And no logged line shall contain "a-77e1"

  Rule: When the application logs a line with an empty context through the library's log functions, the global logger shall receive that line without a context.
    An empty object adds nothing to a line, and a structured sink would
    write it as an empty field. `ILogger` promises a logger never receives
    `{}`.

    Scenario: An empty context is dropped
      Given the global logger is a recording logger
      When the application logs "cache cleared" at level "info" through the library with the context:
        """
        {}
        """
      Then the global logger shall receive only the "info" line "cache cleared"
      And the line shall carry no context

  Rule: When the application logs a line whose context carries no sensitive query parameter through the library's log functions, the global logger shall receive the context object the application passed, not a copy.
    Redaction copies a context only when a field needs it. Most lines carry
    nothing to redact, and copying each of them would cost every log call an
    allocation for nothing.

    Scenario: A context with nothing to redact arrives as passed
      Given the global logger is a recording logger
      When the application logs "page fetched" at level "info" through the library with the context:
        """
        { "url": "https://esi.evetech.net/markets/10000002/orders?page=2", "status": 200 }
        """
      Then the line shall carry the very context object the application passed

  Rule: Where the global logger reports a level disabled, the library's log functions shall not pass a line at that level to it.
    A disabled level then costs nothing, not even the redaction. A level the
    logger reports enabled still reaches it.

    Scenario: A debug line is held back while a warning passes
      Given the global logger is a recording logger that reports "debug" disabled
      When the application logs "cache miss" at level "debug" through the library
      And the application logs "slow response" at level "warn" through the library
      Then the global logger shall receive only the "warn" line "slow response"

  # ── pino-compatible sinks ──────────────────────────────────────────

  Rule: When the library logs a line to a sink adapted with toPinoLogger, the sink shall receive the context first and the message second, or the message alone when the line has no context.
    That is pino's calling convention: a merging object, then the message.
    The context's fields become structured fields of the log event instead
    of text inside the message.

    Scenario: A line with context reaches the sink as pino expects
      Given the global logger adapts a pino-compatible sink with toPinoLogger
      When the application logs "slow response" at level "warn" through the library with the context:
        """
        { "status": 503 }
        """
      Then the sink shall receive only one "warn" call with the context and the message "slow response":
        """
        { "status": 503 }
        """

    Scenario: A line without context reaches the sink as the message alone
      Given the global logger adapts a pino-compatible sink with toPinoLogger
      When the application logs "Players online: 21000" at level "info" through the library
      Then the sink shall receive only one "info" call with the message "Players online: 21000"

  Rule: Where a sink adapted with toPinoLogger exposes pino's level values and a current level, the library shall pass the sink only the lines at or above the level the sink holds when each line is logged.
    pino keeps its current level in `levelVal`, and an application can change
    it at any time. The adapter compares numbers instead of calling pino's own
    `isLevelEnabled`, which costs more than the line it would skip, and reads
    the level at each line so a change applies at once.

    Scenario: A sink at info takes the info line and not the debug line
      Given the global logger adapts a pino-compatible sink at level "info" with toPinoLogger
      When the application logs "cache miss" at level "debug" through the library
      And the application logs "Players online: 21000" at level "info" through the library
      Then the sink shall receive only one "info" call with the message "Players online: 21000"

    Scenario: Lowering the sink's level lets a debug line through
      Given the global logger adapts a pino-compatible sink at level "info" with toPinoLogger
      When the sink's level changes to "debug"
      And the application logs "cache miss" at level "debug" through the library
      Then the sink shall receive only one "debug" call with the message "cache miss"

  Rule: Where a sink adapted with toPinoLogger reports levels through isLevelEnabled without a current level value, the library shall pass the sink only the lines it reports enabled.
    A custom sink may answer `isLevelEnabled` without keeping pino's numeric
    level. The adapter then asks the sink, even when the sink lists level
    values, since values alone say nothing about the current level.

    Scenario: A sink that reports debug disabled takes only the warning
      Given the global logger adapts a pino-compatible sink that reports "debug" disabled with toPinoLogger
      When the application logs "cache miss" at level "debug" through the library
      And the application logs "slow response" at level "warn" through the library
      Then the sink shall receive only one "warn" call with the message "slow response"

    Scenario: A sink with level values but no current level is asked
      Given the global logger adapts a pino-compatible sink with level values that reports "debug" disabled with toPinoLogger
      When the application logs "cache miss" at level "debug" through the library
      And the application logs "slow response" at level "warn" through the library
      Then the sink shall receive only one "warn" call with the message "slow response"

  # ── The default and noop loggers ───────────────────────────────────

  Rule: Where an application builds the default logger, the default logger shall take its level from the level argument, then from ESI_LOG_LEVEL, then warn.
    The level argument is what `EsiClientConfig.logLevel` passes, so a
    client's own setting wins over the environment, and a library left
    unconfigured stays quiet below warn. The scenarios read the level
    through `isLevelEnabled`, which writes nothing.

    Scenario: A level argument wins
      Given a default logger built with level "debug" while ESI_LOG_LEVEL is "error"
      Then the logger shall report "debug" enabled and "trace" disabled

    Scenario: A level argument applies with ESI_LOG_LEVEL unset
      Given a default logger built with level "error" while ESI_LOG_LEVEL is unset
      Then the logger shall report "error" enabled and "warn" disabled

    Scenario: ESI_LOG_LEVEL applies without a level argument
      Given a default logger built with no level while ESI_LOG_LEVEL is "info"
      Then the logger shall report "info" enabled and "debug" disabled

    Scenario: Warn applies with neither
      Given a default logger built with no level while ESI_LOG_LEVEL is unset
      Then the logger shall report "warn" enabled and "info" disabled

  Rule: The noop logger shall report every level disabled.
    The noop logger discards every line, so the library should not build
    one for it. Reporting each level disabled lets the library skip the
    line before it formats or redacts anything.

    Scenario: The noop logger reports all six levels disabled
      Given a noop logger
      Then the logger shall report every level disabled

  # ── The token manager's logger ─────────────────────────────────────

  @sec-P3
  Rule: If an SSO refresh fails with a description that carries a URL, then the token manager's logger shall receive that URL with the value of every sensitive query parameter replaced by [REDACTED].
    The token manager logs a failed refresh with the SSO error's message,
    and SSO's error description is free text that can carry a URL. The
    manager writes to its logger through the same redaction as the
    pipeline, so a code or token in that URL stays out of the log.

    Scenario: An OAuth code in an SSO error description is logged redacted
      Given a token manager that logs to a recording logger that reports "debug" disabled
      And SSO refuses the character's refresh with HTTP 400 and the description "see https://login.eveonline.com/help?code=c0de&lang=en"
      When the token manager refreshes the character and SSO refuses it
      Then the token manager's logger shall receive one "error" line containing "https://login.eveonline.com/help?code=%5BREDACTED%5D&lang=en"
      And no logged line shall contain "c0de"

  Rule: Where the token manager's logger reports a level disabled, the token manager shall not pass a line at that level to it.
    The manager checks the level before it builds and redacts a line, as
    the pipeline does.

    Scenario: A refresh failure is not logged while error is disabled
      Given a token manager that logs to a recording logger that reports "error" disabled
      And SSO refuses the character's refresh with HTTP 400 and the description "see https://login.eveonline.com/help?code=c0de&lang=en"
      When the token manager refreshes the character and SSO refuses it
      Then the token manager's logger shall receive no line
