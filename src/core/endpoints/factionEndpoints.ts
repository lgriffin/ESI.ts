import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  FactionWarfareStatsSchema,
  FactionWarfareCharacterStatsSchema,
  FactionWarfareSystemSchema,
  FactionWarfareWarSchema,
  FactionWarfareFactionLeaderboardSchema,
  FactionWarfareCharacterLeaderboardSchema,
  FactionWarfareCorporationLeaderboardSchema,
  FactionWarfareCorporationStatsSchema,
} from '../../schemas/faction-warfare';

export const factionEndpoints = {
  getCharacterStats: fromOperation('GetCharactersCharacterIdFwStats', {
    pathParams: ['characterId'],
    responseSchema: FactionWarfareCharacterStatsSchema,
  }),
  getCorporationStats: fromOperation('GetCorporationsCorporationIdFwStats', {
    pathParams: ['corporationId'],
    responseSchema: FactionWarfareCorporationStatsSchema,
  }),
  getOverall: fromOperation('GetFwLeaderboards', {
    responseSchema: FactionWarfareFactionLeaderboardSchema,
  }),
  getCharacters: fromOperation('GetFwLeaderboardsCharacters', {
    responseSchema: FactionWarfareCharacterLeaderboardSchema,
  }),
  getCorporations: fromOperation('GetFwLeaderboardsCorporations', {
    responseSchema: FactionWarfareCorporationLeaderboardSchema,
  }),
  getStats: fromOperation('GetFwStats', {
    responseSchema: z.array(FactionWarfareStatsSchema),
  }),
  getSystems: fromOperation('GetFwSystems', {
    responseSchema: z.array(FactionWarfareSystemSchema),
  }),
  getWars: fromOperation('GetFwWars', {
    responseSchema: z.array(FactionWarfareWarSchema),
  }),
} as const satisfies EndpointMap;
