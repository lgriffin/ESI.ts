# no-check without a reason fixture

Must be rejected. The block itself compiles; the annotation that skips it gives
no reason, so nobody can tell whether the skip is still needed.

<!-- doc-example: no-check -->

```ts
const answer: number = 42;
```
