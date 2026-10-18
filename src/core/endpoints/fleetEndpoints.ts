import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  FleetInfoSchema,
  FleetMemberSchema,
  FleetWingSchema,
  CharacterFleetInfoSchema,
  FleetWingCreatedSchema,
  FleetSquadCreatedSchema,
} from '../../schemas/fleet';

export const fleetEndpoints = {
  getCharacterFleetInfo: fromOperation('GetCharactersCharacterIdFleet', {
    pathParams: ['characterId'],
    responseSchema: CharacterFleetInfoSchema,
  }),
  getFleetInfo: fromOperation('GetFleetsFleetId', {
    pathParams: ['fleetId'],
    responseSchema: FleetInfoSchema,
  }),
  updateFleet: fromOperation('PutFleetsFleetId', {
    pathParams: ['fleetId'],
    hasBody: true,
    requestSchema: z.looseObject({
      is_free_move: z.boolean().optional(),
      motd: z.string().optional(),
    }),
  }),
  getFleetMembers: fromOperation('GetFleetsFleetIdMembers', {
    pathParams: ['fleetId'],
    responseSchema: z.array(FleetMemberSchema),
  }),
  createFleetInvitation: fromOperation('PostFleetsFleetIdMembers', {
    trailingSlash: true,
    pathParams: ['fleetId'],
    hasBody: true,
  }),
  kickFleetMember: fromOperation('DeleteFleetsFleetIdMembersMemberId', {
    trailingSlash: true,
    pathParams: ['fleetId', 'memberId'],
  }),
  moveFleetMember: fromOperation('PutFleetsFleetIdMembersMemberId', {
    trailingSlash: true,
    pathParams: ['fleetId', 'memberId'],
    hasBody: true,
  }),
  deleteFleetSquad: fromOperation('DeleteFleetsFleetIdSquadsSquadId', {
    trailingSlash: true,
    pathParams: ['fleetId', 'squadId'],
  }),
  renameFleetSquad: fromOperation('PutFleetsFleetIdSquadsSquadId', {
    trailingSlash: true,
    pathParams: ['fleetId', 'squadId'],
    bodyBuilder: (name: string) => ({ name }),
  }),
  getFleetWings: fromOperation('GetFleetsFleetIdWings', {
    trailingSlash: true,
    pathParams: ['fleetId'],
    responseSchema: z.array(FleetWingSchema),
  }),
  createFleetWing: fromOperation('PostFleetsFleetIdWings', {
    trailingSlash: true,
    responseSchema: FleetWingCreatedSchema,
    pathParams: ['fleetId'],
    hasBody: true,
  }),
  deleteFleetWing: fromOperation('DeleteFleetsFleetIdWingsWingId', {
    trailingSlash: true,
    pathParams: ['fleetId', 'wingId'],
  }),
  renameFleetWing: fromOperation('PutFleetsFleetIdWingsWingId', {
    trailingSlash: true,
    pathParams: ['fleetId', 'wingId'],
    bodyBuilder: (name: string) => ({ name }),
  }),
  createFleetSquad: fromOperation('PostFleetsFleetIdWingsWingIdSquads', {
    trailingSlash: true,
    responseSchema: FleetSquadCreatedSchema,
    pathParams: ['fleetId', 'wingId'],
  }),
} as const satisfies EndpointMap;
