# Syntax error fixture

Must be rejected: a method signature listing left unannotated does not parse.
tsc reports no type errors while any file has a syntax error, so this fixture
also proves the other fixtures' type errors are still reported beside it.

```ts
getStatus(): Promise<ServerStatus>
```
