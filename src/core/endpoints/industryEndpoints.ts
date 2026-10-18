import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  IndustryJobSchema,
  CorporationIndustryJobSchema,
  MiningLedgerEntrySchema,
  IndustryFacilitySchema,
  IndustrySystemSchema,
  MoonExtractionTimerSchema,
  MiningObserverSchema,
  MiningObserverEntrySchema,
} from '../../schemas/industry';

export const industryEndpoints = {
  getCharacterIndustryJobs: fromOperation(
    'GetCharactersCharacterIdIndustryJobs',
    {
      pathParams: ['characterId'],
      responseSchema: z.array(IndustryJobSchema),
    },
  ),
  getCharacterMiningLedger: fromOperation('GetCharactersCharacterIdMining', {
    pathParams: ['characterId'],
    responseSchema: z.array(MiningLedgerEntrySchema),
  }),
  getCorporationIndustryJobs: fromOperation(
    'GetCorporationsCorporationIdIndustryJobs',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationIndustryJobSchema),
    },
  ),
  getMoonExtractionTimers: fromOperation(
    'GetCorporationCorporationIdMiningExtractions',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(MoonExtractionTimerSchema),
    },
  ),
  getCorporationMiningObservers: fromOperation(
    'GetCorporationCorporationIdMiningObservers',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(MiningObserverSchema),
    },
  ),
  getCorporationMiningObserver: fromOperation(
    'GetCorporationCorporationIdMiningObserversObserverId',
    {
      pathParams: ['corporationId', 'observerId'],
      responseSchema: z.array(MiningObserverEntrySchema),
    },
  ),
  getIndustryFacilities: fromOperation('GetIndustryFacilities', {
    responseSchema: z.array(IndustryFacilitySchema),
  }),
  getIndustrySystems: fromOperation('GetIndustrySystems', {
    responseSchema: z.array(IndustrySystemSchema),
  }),
} as const satisfies EndpointMap;
