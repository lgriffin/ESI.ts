import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
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
  getCharacterStats: {
    path: 'characters/{characterId}/fw/stats',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: FactionWarfareCharacterStatsSchema,
  },
  getCorporationStats: {
    path: 'corporations/{corporationId}/fw/stats',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: FactionWarfareCorporationStatsSchema,
  },
  getOverall: {
    path: 'fw/leaderboards',
    method: 'GET',
    requiresAuth: false,
    responseSchema: FactionWarfareFactionLeaderboardSchema,
  },
  getCharacters: {
    path: 'fw/leaderboards/characters',
    method: 'GET',
    requiresAuth: false,
    responseSchema: FactionWarfareCharacterLeaderboardSchema,
  },
  getCorporations: {
    path: 'fw/leaderboards/corporations',
    method: 'GET',
    requiresAuth: false,
    responseSchema: FactionWarfareCorporationLeaderboardSchema,
  },
  getStats: {
    path: 'fw/stats',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(FactionWarfareStatsSchema),
  },
  getSystems: {
    path: 'fw/systems',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(FactionWarfareSystemSchema),
  },
  getWars: {
    path: 'fw/wars',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(FactionWarfareWarSchema),
  },
} as const satisfies EndpointMap;
