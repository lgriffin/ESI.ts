import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const insuranceEndpoints = {
    getInsurancePrices: {
        path: 'insurance/prices',
        method: 'GET',
        requiresAuth: false,
    },
} as const satisfies EndpointMap;
