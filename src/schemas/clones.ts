import { z } from 'zod';

export const CloneInfoSchema = z.looseObject({
  home_location: z
    .looseObject({
      location_id: z.number(),
      location_type: z.enum(['station', 'structure']),
    })
    .optional(),
  jump_clones: z.array(
    z.looseObject({
      jump_clone_id: z.number(),
      location_id: z.number(),
      location_type: z.enum(['station', 'structure']),
      implants: z.array(z.number()),
      name: z.string().optional(),
    }),
  ),
  last_clone_jump_date: z.string().optional(),
  last_station_change_date: z.string().optional(),
});
