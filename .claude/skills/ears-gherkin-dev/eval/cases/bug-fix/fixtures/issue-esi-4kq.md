# esi-4kq — getMarketOrders drops order_type after the first page

Type: bug · Priority: P1 · Status: open · Assignee: you

## Report

`client.market.getMarketOrders(10000002, 'sell')` against The Forge returns
buy orders mixed in with the sell orders. The region order book is paginated
(X-Pages is 12 for The Forge).

## Reproduction

```
GET markets/10000002/orders/?order_type=sell          -> X-Pages: 3
GET markets/10000002/orders/?page=2                    <- order_type missing
GET markets/10000002/orders/?page=3                    <- order_type missing
```

Pages 2 and onward are requested without the `order_type` filter, so ESI
returns both sides of the book for them.

## Acceptance

- The filter is sent on every page request.
- A single-page book is unaffected.
