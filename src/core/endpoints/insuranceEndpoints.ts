import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { InsurancePriceSchema } from '../../schemas/insurance';

export const insuranceEndpoints = {
  getInsurancePrices: {
    path: 'insurance/prices',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(InsurancePriceSchema),
  },
} as const satisfies EndpointMap;
