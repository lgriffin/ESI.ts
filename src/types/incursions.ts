import { z } from 'zod';
import { IncursionSchema } from '../schemas/incursions';

export type Incursion = z.infer<typeof IncursionSchema>;
