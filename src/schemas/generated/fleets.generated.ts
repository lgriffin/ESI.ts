 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersCharacterIdFleetGetSchema = z.looseObject({
  fleet_boss_id: z.number(),
  fleet_id: z.number(),
  role: z.enum(['fleet_commander', 'squad_commander', 'squad_member', 'wing_commander']),
  squad_id: z.number(),
  wing_id: z.number(),
});

export const FleetsFleetIdGetSchema = z.looseObject({
  is_free_move: z.boolean(),
  is_registered: z.boolean(),
  is_voice_enabled: z.boolean(),
  motd: z.string(),
});

export const FleetsFleetIdMembersGetSchema = z.looseObject({
  character_id: z.number(),
  join_time: z.string(),
  role: z.enum(['fleet_commander', 'wing_commander', 'squad_commander', 'squad_member']),
  role_name: z.string(),
  ship_type_id: z.number(),
  solar_system_id: z.number(),
  squad_id: z.number(),
  station_id: z.number().optional(),
  takes_fleet_warp: z.boolean(),
  wing_id: z.number(),
});

export const FleetsFleetIdWingsGetSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  squads: z.array(z.looseObject({
    id: z.number(),
    name: z.string(),
  })),
});
