# Unexported sub-path fixture

Must be rejected. The file exists inside the package, but `exports` does not
list the sub-path, so a consumer's resolver refuses it.

```ts
import { isNotFound } from '@lgriffin/esi.ts/dist/errors';

isNotFound(new Error('unreachable'));
```
