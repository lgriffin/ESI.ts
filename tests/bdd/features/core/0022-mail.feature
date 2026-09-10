Feature: Mail Management
  The Mail client wraps the character mail endpoints: reading inbox headers and
  individual messages, managing labels and mailing-list subscriptions, and the
  write operations for sending, deleting, and re-labelling mail. It is the one
  domain in the library with a full create/read/update/delete surface, so both
  the returned payload shapes and the arguments forwarded to ESI matter.

  Every operation is character-scoped and authenticated, which makes 403 the
  expected failure for an unauthenticated caller.

  # ── Reading mail ────────────────────────────────────────────────────

  Rule: When the mail headers of a character are requested, the Mail client shall return one summary per message carrying mail_id, from, subject, timestamp, and is_read.
    Headers are the cheap listing view — enough to render an inbox without
    fetching a body per row. The read flag and timestamp are what let a caller
    sort and badge the list, so both are part of the summary rather than the
    full message.

    Scenario: Inbox holding three messages returns a summary for each
      Given an authenticated character with mail
      When the client requests their inbox headers
      Then the client shall return a list of mail summaries

  Rule: If a character's inbox holds no messages, then the Mail client shall return an empty list.
    An empty inbox is a normal state, not a failure. ESI answers with an empty
    array and the client passes it through, so callers branch on length rather
    than catching.

    Scenario: Character with no mail returns no summaries
      Given an authenticated character with no mail
      When the client requests their empty inbox headers
      Then the client shall return an empty mail list

  Rule: When a single message is requested by mail ID, the Mail client shall return that message with its mail_id, subject, sender, and recipient list.
    The per-message endpoint is the only place the recipient list appears, so
    fetching one message is how a caller discovers who else received it. The
    mail_id echoed back confirms which message was resolved.

    Scenario: Requesting a mail by ID returns its sender and recipients
      Given a character with a specific mail
      When the client requests the full mail
      Then the client shall return the complete message with its recipients

  # ── Labels and mailing lists ────────────────────────────────────────

  Rule: When the mail labels of a character are requested, the Mail client shall return the total unread count together with the label_id, name, and unread_count of each label.
    A label is both a folder and a counter. The aggregate total is reported
    separately from the per-label counts because a single unread message can
    carry more than one label, making the per-label counts sum to at least the
    total rather than exactly it.

    Scenario: Four labels are returned with unread counts and an inbox total
      Given an authenticated character with mail labels
      When the client requests their mail labels
      Then the client shall return labels with unread counts

  Rule: When the mailing list subscriptions of a character are requested, the Mail client shall return each subscription with a numeric mailing_list_id and a string name.
    Mailing lists are addressable as mail recipients, so the numeric ID is the
    part a caller needs when composing. The name exists only for display.

    Scenario: Subscribed mailing lists return numeric IDs and names
      Given an authenticated character subscribed to mailing lists
      When the client requests their mailing lists
      Then the client shall return the mailing list details

  # ── Creating mail resources ─────────────────────────────────────────

  Rule: When a mail resource is created, the Mail client shall return the numeric identifier that ESI assigns to it.
    Both creating a label and sending a message produce a new server-side
    resource whose ID the caller has no way to predict. Returning it directly
    saves a follow-up listing call to find what was created.

    Scenario: Created label returns its assigned numeric ID
      Given an authenticated character for label creation
      When the client creates a new mail label
      Then the client shall return the new label ID

    Scenario: Sent mail returns its assigned numeric ID
      Given an authenticated character for sending mail
      When the client sends a mail to another character
      Then the client shall return the new mail ID

  # ── Mutating existing mail ──────────────────────────────────────────

  Rule: When a mail deletion, a label deletion, or a metadata update is requested, the Mail client shall forward the character ID, the target resource ID, and any update payload unchanged to the corresponding ESI operation.
    These three operations return no body, so the only observable contract is
    what gets sent. Dropping or reordering an identifier would target the
    wrong resource, and metadata updates carry a payload that has to survive
    the call intact for a read flag or label change to land.

    Scenario: Deleting a custom label forwards the character and label IDs
      Given an authenticated character with a custom label
      When the client deletes the mail label
      Then the delete label operation shall complete without error

    Scenario: Deleting a message forwards the character and mail IDs
      Given an authenticated character with a mail to delete
      When the client deletes the mail
      Then the delete mail operation shall complete without error

    Scenario: Marking a mail as read forwards the metadata payload
      Given an unread mail
      When the client updates its metadata to mark it as read
      Then the update metadata operation shall complete without error

  # ── Concurrent reads ────────────────────────────────────────────────

  Rule: When header, label, and mailing-list requests are issued concurrently, the Mail client shall resolve each request with the payload of its own endpoint.
    A mail UI opens all three views at once. Sharing one client across
    in-flight requests has to keep the responses separate, so this scenario
    checks that each promise settles with its own data and not another's.

    Scenario: Headers, labels, and mailing lists fetched in parallel each resolve
      Given an authenticated character for concurrent mail fetch
      When the client fetches headers, labels, and lists concurrently
      Then all three mail requests shall resolve successfully

  # ── Error propagation ───────────────────────────────────────────────

  Rule: If the ESI API rejects a mail request with an error status, then the Mail client shall raise an EsiError.
    Every mail endpoint reports failure the same way so a caller can wrap the
    whole surface in one try/catch. The two scenarios cover the authorisation
    boundary and a missing resource.

    Scenario: Unauthenticated header request is rejected with 403
      Given an unauthenticated mail request
      When the client requests mail headers without auth
      Then the client shall return a 403 forbidden error for mail

    Scenario: Unknown mail ID is rejected with 404
      Given a mail ID that does not exist
      When the client requests the non-existent mail
      Then the client shall return a 404 not found error for mail
