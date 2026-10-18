import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import { IncursionSchema } from '../../schemas/incursions';

export const incursionEndpoints = {
  getIncursions: fromOperation('GetIncursions', {
    responseSchema: z.array(IncursionSchema),
  }),
} as const satisfies EndpointMap;
