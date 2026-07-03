import { z } from 'zod';

export const FleetInfoSchema = z.looseObject({
  fleet_id: z.number().optional(),
  fleet_boss_id: z.number().optional(),
  is_free_move: z.boolean(),
  is_registered: z.boolean(),
  is_voice_enabled: z.boolean(),
  motd: z.string(),
});

export const FleetMemberSchema = z.looseObject({
  character_id: z.number(),
  ship_type_id: z.number(),
  wing_id: z.number(),
  squad_id: z.number(),
  role: z.enum([
    'fleet_commander',
    'wing_commander',
    'squad_commander',
    'squad_member',
  ]),
  role_name: z.string(),
  join_time: z.string(),
  takes_fleet_warp: z.boolean(),
  solar_system_id: z.number(),
  station_id: z.number().optional(),
});

export const FleetWingSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  squads: z.array(
    z.looseObject({
      id: z.number(),
      name: z.string(),
    }),
  ),
});

export const CharacterFleetInfoSchema = z.looseObject({
  fleet_id: z.number(),
  role: z.enum([
    'fleet_commander',
    'wing_commander',
    'squad_commander',
    'squad_member',
  ]),
  squad_id: z.number(),
  wing_id: z.number(),
});
