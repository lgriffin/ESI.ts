import { z } from 'zod';
import { WarSchema } from '../schemas/wars';

export type War = z.infer<typeof WarSchema>;
