@DES-08
Feature: Page walks through every entry point
  A paged collection reaches the caller three ways: the eager method, which
  the request pipeline pages; the fetch-all helper, which requests the pages
  after the first in concurrent waves; and the stream helper, which yields one
  page at a time. 0051-resilience.feature specifies how a walk that stops
  short behaves through the eager method; these Rules hold the three entry
  points to the same page count, the same limits and the same validation, and
  the cursor pagination handler to the cursor it was handed.

  The market orders of The Forge are served as numbered pages at the seam.
  Each page answers only its own page number, so a page requested twice or
  one past the queue fails the scenario.

  # ── Complete walks

  Rule: Where incompletePages is set to throw, when page 1 reports N pages and pages 2 to N each carry items, the EsiClient shall resolve every entry point with the items of pages 1 to N in page order.
    A complete walk is not short, so the mode that rejects short walks must
    leave it alone.

    Scenario Outline: Three full pages of market orders resolve through the <entry point> entry point
      Given a client in incompletePages mode "throw" with a recording logger
      And ESI answers the market orders with 3 pages of 2 orders each
      When the client walks the market orders through the <entry point> entry point
      Then the walk shall resolve with the orders of pages 1 to 3
      And the client shall have sent 3 requests

      Examples:
        | entry point |
        | eager       |
        | fetch-all   |
        | stream      |

  Rule: Where incompletePages is set to throw, when page 1 reports exactly 1000 pages, the EsiClient shall resolve every entry point with the items of all 1000 pages.
    1000 is the most pages any walk requests (security model P8), so a count
    of exactly 1000 can be walked in full and is not cut short.

    Scenario Outline: Market orders reported as exactly 1000 pages resolve through the <entry point> entry point
      Given a client in incompletePages mode "throw" with a recording logger
      And ESI answers the market orders with 1000 pages of 1 orders each
      When the client walks the market orders through the <entry point> entry point
      Then the walk shall resolve with the orders of pages 1 to 1000
      And the client shall have sent 1000 requests

      Examples:
        | entry point |
        | eager       |
        | fetch-all   |
        | stream      |

  # ── Walks cut short under the default

  Rule: Where incompletePages is left at its default, if page 1 reports more than 1000 pages, then the EsiClient shall resolve every entry point with the items of pages 1 to 1000 and log one warning that reports 1000 fetched pages.
    The default keeps what the walk could fetch, as every 12.x release has,
    and the warning is the only sign that the result is short.

    Scenario Outline: Market orders reported as 1001 pages stop at page 1000 through the <entry point> entry point
      Given a client in incompletePages mode "truncate" with a recording logger
      And ESI answers the market orders with 1001 pages reported and 1000 pages of 1 orders each
      When the client walks the market orders through the <entry point> entry point
      Then the walk shall resolve with the orders of pages 1 to 1000
      And the logger shall have received one incompletePages warning for reason "page-cap" with 1000 fetched pages

      Examples:
        | entry point |
        | eager       |
        | fetch-all   |
        | stream      |

  Rule: Where incompletePages is left at its default, if more than one page after the first comes back empty, then the fetch-all helper shall log one warning for the walk.
    One short walk is one warning, however many empty pages the concurrent
    wave brought back.

    Scenario: Market orders whose pages 2 and 3 of 4 are empty warn once through the fetch-all helper
      Given a client in incompletePages mode "truncate" with a recording logger
      And ESI answers the market orders with 4 pages, pages 2 and 3 empty
      When the client walks the market orders through the fetch-all entry point
      Then the logger shall have received one incompletePages warning for reason "empty-page" with 2 fetched pages

  Rule: Where incompletePages is set to throw, if a page after the second comes back empty in a stream, then the EsiClient shall reject the stream with an error that counts the items of every page yielded before it.
    A stream has handed its pages over already, so its error counts them all
    rather than only the first page's.

    Scenario: A stream whose page 3 of 3 is empty counts the orders of pages 1 and 2
      Given a client in incompletePages mode "throw" with a recording logger
      And ESI answers the market orders with 3 pages, page 3 empty
      When the client walks the market orders through the stream entry point
      Then the walk shall reject with an EsiPaginationError whose reason is "empty-page" counting 4 items

  # ── Page counts the client does not trust

  Rule: If page 1 carries an X-Pages count below 1, then the stream helper shall yield page 1 as the only page and report 1 page in total.
    A count of zero or less is unreadable, the same as a missing header, and
    the walk has its first page already. The page count a stream reports is
    the one a progress bar divides by.

    Scenario Outline: Market orders reported as <count> pages stream as one page of one
      Given a client in incompletePages mode "truncate" with a recording logger
      And ESI answers the market orders with 1 page of 2 orders reporting "<count>" pages
      When the client streams the market orders page by page
      Then the stream shall have yielded 1 page reporting 1 page in total
      And the client shall have sent 1 request

      Examples:
        | count |
        | 0     |
        | -3    |

  # ── Validation and page shapes

  Rule: If a page fails its response schema, then the fetch-all helper shall reject with an EsiValidationError.
    The fetch-all helper validates each page against the endpoint's schema,
    as the eager method validates the whole answer.

    Scenario: A market orders page with an order id that is not a number is refused
      Given a client in incompletePages mode "truncate" with a recording logger
      And ESI answers the market orders with 2 pages, page 2 holding an order whose id is not a number
      When the client walks the market orders through the fetch-all entry point
      Then the call shall be rejected with an EsiValidationError naming "page=2"

  Rule: Where response validation is turned off, the fetch-all helper shall resolve with each page as ESI sent it.
    Turning validation off is how a caller reads an answer the schema does
    not yet describe.

    Scenario: A market orders page with an order id that is not a number is kept when validation is off
      Given a client that does not validate responses
      And ESI answers the market orders with 2 pages, page 2 holding an order whose id is not a number
      When the client walks the market orders through the fetch-all entry point
      Then the walk shall resolve with 2 orders, the second with the order id "seven"

  Rule: When the fetch-all helper reads an endpoint that answers one object, the fetch-all helper shall resolve with that object as its only item.
    The helpers return a list for every endpoint, so an answer that is not a
    list is the list's only item.

    Scenario: The server status read through the fetch-all helper is a list of one status
      Given a client in incompletePages mode "truncate" with a recording logger
      And ESI reports the server status
      When the client reads the server status through the fetch-all helper
      Then the walk shall resolve with the server status as its only item

  Rule: When the fetch-all helper reads an endpoint that answers JSON null, the fetch-all helper shall resolve with no items.
    A null answer holds nothing, so it is an empty list rather than a list of
    one null.

    Scenario: A server status of null read without validation is an empty list
      Given a client that does not validate responses
      And ESI answers the server status with JSON null
      When the client reads the server status through the fetch-all helper
      Then the walk shall resolve with 0 orders

  # ── The exported helpers

  @TEST-11
  Rule: When the exported fetchAllPages or fetchPages helper is called without its requiresAuth argument, the helper shall not send an Authorization header.
    The exported helpers default to a public route, so a caller that leaves
    the argument out does not put the client's token on the wire.

    Scenario Outline: The exported <helper> helper walks the market orders without a bearer
      Given a client in incompletePages mode "truncate" with a recording logger
      And ESI answers the market orders with 1 page of 2 orders reporting "1" pages
      When the exported <helper> helper walks the market orders with its defaults
      Then the request shall not carry the header "Authorization"

      Examples:
        | helper        |
        | fetchAllPages |
        | fetchPages    |

  # ── The cursor walk

  Rule: When the cursor pagination handler requests the next page, the cursor pagination handler shall send the after cursor it holds as the after query parameter.
    The after cursor is the only thing that tells ESI where the next page
    starts; a request without it reads the first page again.

    Scenario: The next corporation projects page is asked for after the cursor
      Given a cursor pagination client
      And ESI answers the next corporation projects page with 1 project and no after cursor
      When the handler walks the corporation projects from the after cursor "cursor-1"
      Then the request to ESI shall carry the query parameter "after" with the value "cursor-1"
      And the cursor walk shall resolve with 2 projects

  Rule: When a cursor page answers one object, the cursor pagination handler shall add that object as the page's only item.
    A page body that is not a list is the page's only item, as on the offset
    path.

    Scenario: A corporation projects page that is one project object adds that project
      Given a cursor pagination client
      And ESI answers the next corporation projects page with one project object and no after cursor
      When the handler walks the corporation projects from the after cursor "cursor-1"
      Then the cursor walk shall resolve with the first project and the project object

  Rule: When a cursor page answers JSON null, the cursor pagination handler shall treat it as an empty page that ends the walk.
    ESI ends a cursor dataset with an empty page, and a null body holds no
    items either.

    Scenario: A corporation projects page of null ends the walk with the first page
      Given a cursor pagination client
      And ESI answers the next corporation projects page with JSON null and an after cursor
      When the handler walks the corporation projects from the after cursor "cursor-1"
      Then the cursor walk shall resolve with 1 projects

  Rule: If three consecutive cursor pages fail with an error that is not an ESI error, then the cursor pagination handler shall reject with an EsiPaginationError whose reason is fetch-failed and that carries the items fetched so far.
    An ESI error is rethrown as it is (0051-resilience.feature); any other
    failure, such as one from a page fetcher, becomes the pagination error
    that reports how far the walk got.

    Scenario: A page fetcher that keeps failing rejects with the first page as partial
      Given a cursor pagination client
      When the handler walks the corporation projects through a page fetcher that always fails
      Then the cursor walk shall reject with an EsiPaginationError whose reason is "fetch-failed" carrying the first project
