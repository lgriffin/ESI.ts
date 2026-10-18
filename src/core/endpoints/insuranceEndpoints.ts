import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import { InsurancePriceSchema } from '../../schemas/insurance';

export const insuranceEndpoints = {
  getInsurancePrices: fromOperation('GetInsurancePrices', {
    responseSchema: z.array(InsurancePriceSchema),
  }),
} as const satisfies EndpointMap;
