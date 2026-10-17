import { z } from 'zod';
import {
  CharacterLocationSchema,
  CharacterOnlineSchema,
  CharacterShipSchema,
} from '../schemas/location';

export type CharacterLocation = z.infer<typeof CharacterLocationSchema>;
export type CharacterOnline = z.infer<typeof CharacterOnlineSchema>;
export type CharacterShip = z.infer<typeof CharacterShipSchema>;
