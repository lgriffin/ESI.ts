import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  FleetInfoSchema,
  FleetMemberSchema,
  FleetWingSchema,
  CharacterFleetInfoSchema,
} from '../../schemas/fleet';

export const fleetEndpoints = {
  getCharacterFleetInfo: {
    path: 'characters/{characterId}/fleet',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: CharacterFleetInfoSchema,
  },
  getFleetInfo: {
    path: 'fleets/{fleetId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['fleetId'],
    responseSchema: FleetInfoSchema,
  },
  updateFleet: {
    path: 'fleets/{fleetId}',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['fleetId'],
    hasBody: true,
  },
  getFleetMembers: {
    path: 'fleets/{fleetId}/members',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['fleetId'],
    responseSchema: z.array(FleetMemberSchema),
  },
  createFleetInvitation: {
    path: 'fleets/{fleetId}/members/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['fleetId'],
    hasBody: true,
  },
  kickFleetMember: {
    path: 'fleets/{fleetId}/members/{memberId}/',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['fleetId', 'memberId'],
  },
  moveFleetMember: {
    path: 'fleets/{fleetId}/members/{memberId}/',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['fleetId', 'memberId'],
    hasBody: true,
  },
  deleteFleetSquad: {
    path: 'fleets/{fleetId}/squads/{squadId}/',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['fleetId', 'squadId'],
  },
  renameFleetSquad: {
    path: 'fleets/{fleetId}/squads/{squadId}/',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['fleetId', 'squadId'],
    bodyBuilder: (name: string) => ({ name }),
  },
  getFleetWings: {
    path: 'fleets/{fleetId}/wings/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['fleetId'],
    responseSchema: z.array(FleetWingSchema),
  },
  createFleetWing: {
    path: 'fleets/{fleetId}/wings/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['fleetId'],
    hasBody: true,
  },
  deleteFleetWing: {
    path: 'fleets/{fleetId}/wings/{wingId}/',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['fleetId', 'wingId'],
  },
  renameFleetWing: {
    path: 'fleets/{fleetId}/wings/{wingId}/',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['fleetId', 'wingId'],
    bodyBuilder: (name: string) => ({ name }),
  },
  createFleetSquad: {
    path: 'fleets/{fleetId}/wings/{wingId}/squads/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['fleetId', 'wingId'],
  },
} as const satisfies EndpointMap;
