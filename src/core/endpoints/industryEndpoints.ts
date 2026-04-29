import { EndpointMap } from './EndpointDefinition';

export const industryEndpoints = {
  getCharacterIndustryJobs: {
    path: 'characters/{characterId}/industry/jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterMiningLedger: {
    path: 'characters/{characterId}/mining',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCorporationIndustryJobs: {
    path: 'corporations/{corporationId}/industry/jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  getMoonExtractionTimers: {
    path: 'corporations/{corporationId}/mining/extractions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  getCorporationMiningObservers: {
    path: 'corporations/{corporationId}/mining/observers',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  getCorporationMiningObserver: {
    path: 'corporations/{corporationId}/mining/observers/{observerId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'observerId'],
  },
  getIndustryFacilities: {
    path: 'industry/facilities',
    method: 'GET',
    requiresAuth: false,
  },
  getIndustrySystems: {
    path: 'industry/systems',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
