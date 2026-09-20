import { z } from 'zod';
import { CloneInfoSchema } from '../schemas/clones';

export type CloneInfo = z.infer<typeof CloneInfoSchema>;
