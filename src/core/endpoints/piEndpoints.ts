import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  PlanetaryColonySchema,
  CustomsOfficeSchema,
  ColonyLayoutSchema,
} from '../../schemas/pi';
import { SchematicInfoSchema } from '../../schemas/universe';

export const piEndpoints = {
  getColonies: fromOperation('GetCharactersCharacterIdPlanets', {
    pathParams: ['characterId'],
    responseSchema: z.array(PlanetaryColonySchema),
  }),
  getColonyLayout: fromOperation('GetCharactersCharacterIdPlanetsPlanetId', {
    pathParams: ['characterId', 'planetId'],
    responseSchema: ColonyLayoutSchema,
  }),
  getCorporationCustomsOffices: fromOperation(
    'GetCorporationsCorporationIdCustomsOffices',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CustomsOfficeSchema),
    },
  ),
  getSchematicInformation: fromOperation('GetUniverseSchematicsSchematicId', {
    pathParams: ['schematicId'],
    responseSchema: SchematicInfoSchema,
  }),
} as const satisfies EndpointMap;
