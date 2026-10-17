import { z } from 'zod';
import { IncursionSchema } from '../schemas/incursions';

/**
 * @deprecated Since 12.1.0; removed in 13.0.0 with the legacy domain clients.
 * Name a generated result with `Awaited<ReturnType<…>>` on the scope-tree
 * call; nameable generated types are tracked in guides/LEGACY-REMOVAL.md (G14).
 */
export type Incursion = z.infer<typeof IncursionSchema>;
