import { z } from 'zod';
import {
  PlanetaryColonySchema,
  CustomsOfficeSchema,
  ColonyLayoutSchema,
} from '../schemas/pi';

export type PlanetaryColony = z.infer<typeof PlanetaryColonySchema>;
export type CustomsOffice = z.infer<typeof CustomsOfficeSchema>;
export type ColonyLayout = z.infer<typeof ColonyLayoutSchema>;
