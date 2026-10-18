import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import { ServerStatusSchema } from '../../schemas/status';

export const statusEndpoints = {
  getStatus: fromOperation('GetStatus', {
    responseSchema: ServerStatusSchema,
  }),
} as const satisfies EndpointMap;
