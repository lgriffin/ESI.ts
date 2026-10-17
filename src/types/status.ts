import { z } from 'zod';
import { ServerStatusSchema } from '../schemas/status';

export type ServerStatus = z.infer<typeof ServerStatusSchema>;
