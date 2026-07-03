import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  ContractSchema,
  ContractBidSchema,
  ContractItemSchema,
} from '../../schemas/contracts';

export const contractEndpoints = {
  getCharacterContracts: {
    path: 'characters/{characterId}/contracts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(ContractSchema),
  },
  getCharacterContractBids: {
    path: 'characters/{characterId}/contracts/{contractId}/bids',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'contractId'],
    responseSchema: z.array(ContractBidSchema),
  },
  getCharacterContractItems: {
    path: 'characters/{characterId}/contracts/{contractId}/items',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'contractId'],
    responseSchema: z.array(ContractItemSchema),
  },
  getCorporationContracts: {
    path: 'corporations/{corporationId}/contracts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(ContractSchema),
  },
  getCorporationContractBids: {
    path: 'corporations/{corporationId}/contracts/{contractId}/bids',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'contractId'],
    responseSchema: z.array(ContractBidSchema),
  },
  getCorporationContractItems: {
    path: 'corporations/{corporationId}/contracts/{contractId}/items',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'contractId'],
    responseSchema: z.array(ContractItemSchema),
  },
  getPublicContracts: {
    path: 'contracts/public/{regionId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    responseSchema: z.array(ContractSchema),
  },
  getPublicContractBids: {
    path: 'contracts/public/bids/{contractId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['contractId'],
    responseSchema: z.array(ContractBidSchema),
  },
  getPublicContractItems: {
    path: 'contracts/public/items/{contractId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['contractId'],
    responseSchema: z.array(ContractItemSchema),
  },
} as const satisfies EndpointMap;
