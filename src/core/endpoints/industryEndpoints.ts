import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  IndustryJobSchema,
  MiningLedgerEntrySchema,
  IndustryFacilitySchema,
  IndustrySystemSchema,
  MoonExtractionTimerSchema,
  MiningObserverSchema,
  MiningObserverEntrySchema,
} from '../../schemas/industry';

export const industryEndpoints = {
  getCharacterIndustryJobs: {
    path: 'characters/{characterId}/industry/jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(IndustryJobSchema),
  },
  getCharacterMiningLedger: {
    path: 'characters/{characterId}/mining',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(MiningLedgerEntrySchema),
  },
  getCorporationIndustryJobs: {
    path: 'corporations/{corporationId}/industry/jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(IndustryJobSchema),
  },
  getMoonExtractionTimers: {
    path: 'corporations/{corporationId}/mining/extractions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(MoonExtractionTimerSchema),
  },
  getCorporationMiningObservers: {
    path: 'corporations/{corporationId}/mining/observers',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(MiningObserverSchema),
  },
  getCorporationMiningObserver: {
    path: 'corporations/{corporationId}/mining/observers/{observerId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'observerId'],
    responseSchema: z.array(MiningObserverEntrySchema),
  },
  getIndustryFacilities: {
    path: 'industry/facilities',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(IndustryFacilitySchema),
  },
  getIndustrySystems: {
    path: 'industry/systems',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(IndustrySystemSchema),
  },
} as const satisfies EndpointMap;
