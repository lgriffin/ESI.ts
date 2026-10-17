import { z } from 'zod';
import {
  FleetInfoSchema,
  FleetMemberSchema,
  FleetWingSchema,
  CharacterFleetInfoSchema,
} from '../schemas/fleet';

export type FleetInfo = z.infer<typeof FleetInfoSchema>;
export type FleetMember = z.infer<typeof FleetMemberSchema>;
export type FleetWing = z.infer<typeof FleetWingSchema>;
export type CharacterFleetInfo = z.infer<typeof CharacterFleetInfoSchema>;
