import { EndpointMap } from './EndpointDefinition';

export const contractEndpoints = {
  getCharacterContracts: {
    path: 'characters/{characterId}/contracts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterContractBids: {
    path: 'characters/{characterId}/contracts/{contractId}/bids',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'contractId'],
  },
  getCharacterContractItems: {
    path: 'characters/{characterId}/contracts/{contractId}/items',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'contractId'],
  },
  getCorporationContracts: {
    path: 'corporations/{corporationId}/contracts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  getCorporationContractBids: {
    path: 'corporations/{corporationId}/contracts/{contractId}/bids',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'contractId'],
  },
  getCorporationContractItems: {
    path: 'corporations/{corporationId}/contracts/{contractId}/items',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'contractId'],
  },
  getPublicContracts: {
    path: 'contracts/public/{regionId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
  },
  getPublicContractBids: {
    path: 'contracts/public/bids/{contractId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['contractId'],
  },
  getPublicContractItems: {
    path: 'contracts/public/items/{contractId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['contractId'],
  },
} as const satisfies EndpointMap;
