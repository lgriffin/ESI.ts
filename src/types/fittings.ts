import { z } from 'zod';
import { FittingSchema } from '../schemas/fittings';

export type Fitting = z.infer<typeof FittingSchema>;
