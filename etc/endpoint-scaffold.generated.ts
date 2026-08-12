/* eslint-disable */
// Auto-generated endpoint scaffold from ESI OpenAPI spec — do not edit manually
// Spec version: 2025-12-16
// Total operations: 208
//
// This file is a REFERENCE for comparing against hand-written endpoint
// definitions in src/core/endpoints/. It shows what the OpenAPI spec defines
// for each operation (path, method, auth, params). Hand-written files add
// responseSchema references that cannot be auto-generated.
//
// Usage: npm run generate:endpoints
//        diff this against hand-written files to find missing endpoints

import { EndpointMap } from '../src/core/endpoints/EndpointDefinition';

// --- Alliance ---

export const allianceEndpointScaffold = {
  // GetAlliances
  // List all active player alliances
  GetAlliances: {
    path: 'alliances',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetAlliancesAllianceId
  // Public information about an alliance
  GetAlliancesAllianceId: {
    path: 'alliances/{allianceId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['allianceId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetAlliancesAllianceIdCorporations
  // List all current member corporations of an alliance
  GetAlliancesAllianceIdCorporations: {
    path: 'alliances/{allianceId}/corporations',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['allianceId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetAlliancesAllianceIdIcons
  // Get the icon urls for a alliance
  GetAlliancesAllianceIdIcons: {
    path: 'alliances/{allianceId}/icons',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['allianceId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Assets ---

export const assetsEndpointScaffold = {
  // GetCharactersCharacterIdAssets
  // Return a list of the characters assets
  GetCharactersCharacterIdAssets: {
    path: 'characters/{characterId}/assets',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdAssets
  // Return a list of the corporation assets
  GetCorporationsCorporationIdAssets: {
    path: 'corporations/{corporationId}/assets',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCharactersCharacterIdAssetsLocations
  // Return locations for a set of item ids, which you can get from character assets endpoint. Coordinate
  PostCharactersCharacterIdAssetsLocations: {
    path: 'characters/{characterId}/assets/locations',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCharactersCharacterIdAssetsNames
  // Return names for a set of item ids, which you can get from character assets endpoint. Typically used
  PostCharactersCharacterIdAssetsNames: {
    path: 'characters/{characterId}/assets/names',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCorporationsCorporationIdAssetsLocations
  // Return locations for a set of item ids, which you can get from corporation assets endpoint. Coordina
  PostCorporationsCorporationIdAssetsLocations: {
    path: 'corporations/{corporationId}/assets/locations',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['corporationId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCorporationsCorporationIdAssetsNames
  // Return names for a set of item ids, which you can get from corporation assets endpoint. Only valid f
  PostCorporationsCorporationIdAssetsNames: {
    path: 'corporations/{corporationId}/assets/names',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['corporationId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Calendar ---

export const calendarEndpointScaffold = {
  // GetCharactersCharacterIdCalendar
  // Get 50 event summaries from the calendar. If no from_event ID is given, the resource will return the
  GetCharactersCharacterIdCalendar: {
    path: 'characters/{characterId}/calendar',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { fromEvent: 'from_event' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdCalendarEventId
  // Get all the information for a specific event
  GetCharactersCharacterIdCalendarEventId: {
    path: 'characters/{characterId}/calendar/{eventId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'eventId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdCalendarEventIdAttendees
  // Get all invited attendees for a given event
  GetCharactersCharacterIdCalendarEventIdAttendees: {
    path: 'characters/{characterId}/calendar/{eventId}/attendees',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'eventId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PutCharactersCharacterIdCalendarEventId
  // Set your response status to an event
  PutCharactersCharacterIdCalendarEventId: {
    path: 'characters/{characterId}/calendar/{eventId}',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['characterId', 'eventId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Character ---

export const characterEndpointScaffold = {
  // GetCharactersCharacterId
  // Public information about a character
  GetCharactersCharacterId: {
    path: 'characters/{characterId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdAgentsResearch
  // Return a list of agents research information for a character. The formula for finding the current re
  GetCharactersCharacterIdAgentsResearch: {
    path: 'characters/{characterId}/agents_research',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdBlueprints
  // Return a list of blueprints the character owns
  GetCharactersCharacterIdBlueprints: {
    path: 'characters/{characterId}/blueprints',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdCorporationhistory
  // Get a list of all the corporations a character has been a member of
  GetCharactersCharacterIdCorporationhistory: {
    path: 'characters/{characterId}/corporationhistory',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdFatigue
  // Return a character's jump activation and fatigue information
  GetCharactersCharacterIdFatigue: {
    path: 'characters/{characterId}/fatigue',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdMedals
  // Return a list of medals the character has
  GetCharactersCharacterIdMedals: {
    path: 'characters/{characterId}/medals',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdNotifications
  // Return character notifications
  GetCharactersCharacterIdNotifications: {
    path: 'characters/{characterId}/notifications',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdNotificationsContacts
  // Return notifications about having been added to someone's contact list
  GetCharactersCharacterIdNotificationsContacts: {
    path: 'characters/{characterId}/notifications/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdPortrait
  // Get portrait urls for a character
  GetCharactersCharacterIdPortrait: {
    path: 'characters/{characterId}/portrait',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdRoles
  // Returns a character's corporation roles
  GetCharactersCharacterIdRoles: {
    path: 'characters/{characterId}/roles',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdStandings
  // Return character standings from agents, NPC corporations, and factions
  GetCharactersCharacterIdStandings: {
    path: 'characters/{characterId}/standings',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdTitles
  // Returns a character's titles
  GetCharactersCharacterIdTitles: {
    path: 'characters/{characterId}/titles',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCharactersAffiliation
  // Bulk lookup of character IDs to corporation, alliance and faction
  PostCharactersAffiliation: {
    path: 'characters/affiliation',
    method: 'POST',
    requiresAuth: false,
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCharactersCharacterIdCspa
  // Takes a source character ID in the url and a set of target character ID's in the body, returns a CSP
  PostCharactersCharacterIdCspa: {
    path: 'characters/{characterId}/cspa',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Clones ---

export const clonesEndpointScaffold = {
  // GetCharactersCharacterIdClones
  // A list of the character's clones
  GetCharactersCharacterIdClones: {
    path: 'characters/{characterId}/clones',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdImplants
  // Return implants on the active clone of a character
  GetCharactersCharacterIdImplants: {
    path: 'characters/{characterId}/implants',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Contacts ---

export const contactsEndpointScaffold = {
  // DeleteCharactersCharacterIdContacts
  // Bulk delete contacts
  DeleteCharactersCharacterIdContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { contactIds: 'contact_ids' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetAlliancesAllianceIdContacts
  // Return contacts of an alliance
  GetAlliancesAllianceIdContacts: {
    path: 'alliances/{allianceId}/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['allianceId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetAlliancesAllianceIdContactsLabels
  // Return custom labels for an alliance's contacts
  GetAlliancesAllianceIdContactsLabels: {
    path: 'alliances/{allianceId}/contacts/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['allianceId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdContacts
  // Return contacts of a character
  GetCharactersCharacterIdContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdContactsLabels
  // Return custom labels for a character's contacts
  GetCharactersCharacterIdContactsLabels: {
    path: 'characters/{characterId}/contacts/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdContacts
  // Return contacts of a corporation
  GetCorporationsCorporationIdContacts: {
    path: 'corporations/{corporationId}/contacts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdContactsLabels
  // Return custom labels for a corporation's contacts
  GetCorporationsCorporationIdContactsLabels: {
    path: 'corporations/{corporationId}/contacts/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCharactersCharacterIdContacts
  // Bulk add contacts with same settings
  PostCharactersCharacterIdContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { labelIds: 'label_ids', standing: 'standing', watched: 'watched' },
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PutCharactersCharacterIdContacts
  // Bulk edit contacts with same settings
  PutCharactersCharacterIdContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { labelIds: 'label_ids', standing: 'standing', watched: 'watched' },
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Contracts ---

export const contractsEndpointScaffold = {
  // GetCharactersCharacterIdContracts
  // Returns contracts available to a character, only if the character is issuer, acceptor or assignee. O
  GetCharactersCharacterIdContracts: {
    path: 'characters/{characterId}/contracts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdContractsContractIdBids
  // Lists bids on a particular auction contract
  GetCharactersCharacterIdContractsContractIdBids: {
    path: 'characters/{characterId}/contracts/{contractId}/bids',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'contractId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdContractsContractIdItems
  // Lists items of a particular contract
  GetCharactersCharacterIdContractsContractIdItems: {
    path: 'characters/{characterId}/contracts/{contractId}/items',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'contractId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetContractsPublicBidsContractId
  // Lists bids on a public auction contract
  GetContractsPublicBidsContractId: {
    path: 'contracts/public/bids/{contractId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['contractId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetContractsPublicItemsContractId
  // Lists items of a public contract
  GetContractsPublicItemsContractId: {
    path: 'contracts/public/items/{contractId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['contractId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetContractsPublicRegionId
  // Returns a paginated list of all public contracts in the given region
  GetContractsPublicRegionId: {
    path: 'contracts/public/{regionId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdContracts
  // Returns contracts available to a corporation, only if the corporation is issuer, acceptor or assigne
  GetCorporationsCorporationIdContracts: {
    path: 'corporations/{corporationId}/contracts',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdContractsContractIdBids
  // Lists bids on a particular auction contract
  GetCorporationsCorporationIdContractsContractIdBids: {
    path: 'corporations/{corporationId}/contracts/{contractId}/bids',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['contractId', 'corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdContractsContractIdItems
  // Lists items of a particular contract
  GetCorporationsCorporationIdContractsContractIdItems: {
    path: 'corporations/{corporationId}/contracts/{contractId}/items',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['contractId', 'corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Corporation ---

export const corporationEndpointScaffold = {
  // GetCorporationsCorporationId
  // Public information about a corporation
  GetCorporationsCorporationId: {
    path: 'corporations/{corporationId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdAlliancehistory
  // Get a list of all the alliances a corporation has been a member of
  GetCorporationsCorporationIdAlliancehistory: {
    path: 'corporations/{corporationId}/alliancehistory',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdBlueprints
  // Returns a list of blueprints the corporation owns
  GetCorporationsCorporationIdBlueprints: {
    path: 'corporations/{corporationId}/blueprints',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdContainersLogs
  // Returns logs recorded in the past seven days from all audit log secure containers (ALSC) owned by a 
  GetCorporationsCorporationIdContainersLogs: {
    path: 'corporations/{corporationId}/containers/logs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdDivisions
  // Return corporation hangar and wallet division names, only show if a division is not using the defaul
  GetCorporationsCorporationIdDivisions: {
    path: 'corporations/{corporationId}/divisions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdFacilities
  // Return a corporation's facilities
  GetCorporationsCorporationIdFacilities: {
    path: 'corporations/{corporationId}/facilities',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdIcons
  // Get the icon urls for a corporation
  GetCorporationsCorporationIdIcons: {
    path: 'corporations/{corporationId}/icons',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdMedals
  // Returns a corporation's medals
  GetCorporationsCorporationIdMedals: {
    path: 'corporations/{corporationId}/medals',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdMedalsIssued
  // Returns medals issued by a corporation
  GetCorporationsCorporationIdMedalsIssued: {
    path: 'corporations/{corporationId}/medals/issued',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdMembers
  // Return the current member list of a corporation, the token's character need to be a member of the co
  GetCorporationsCorporationIdMembers: {
    path: 'corporations/{corporationId}/members',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdMembersLimit
  // Return a corporation's member limit, not including CEO himself
  GetCorporationsCorporationIdMembersLimit: {
    path: 'corporations/{corporationId}/members/limit',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdMembersTitles
  // Returns a corporation's members' titles
  GetCorporationsCorporationIdMembersTitles: {
    path: 'corporations/{corporationId}/members/titles',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdMembertracking
  // Returns additional information about a corporation's members which helps tracking their activities
  GetCorporationsCorporationIdMembertracking: {
    path: 'corporations/{corporationId}/membertracking',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdRoles
  // Return the roles of all members if the character has the personnel manager role or any grantable rol
  GetCorporationsCorporationIdRoles: {
    path: 'corporations/{corporationId}/roles',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdRolesHistory
  // Return how roles have changed for a coporation's members, up to a month
  GetCorporationsCorporationIdRolesHistory: {
    path: 'corporations/{corporationId}/roles/history',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdShareholders
  // Return the current shareholders of a corporation.
  GetCorporationsCorporationIdShareholders: {
    path: 'corporations/{corporationId}/shareholders',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdStandings
  // Return corporation standings from agents, NPC corporations, and factions
  GetCorporationsCorporationIdStandings: {
    path: 'corporations/{corporationId}/standings',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdStarbases
  // Returns list of corporation starbases (POSes)
  GetCorporationsCorporationIdStarbases: {
    path: 'corporations/{corporationId}/starbases',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdStarbasesStarbaseId
  // Returns various settings and fuels of a starbase (POS)
  GetCorporationsCorporationIdStarbasesStarbaseId: {
    path: 'corporations/{corporationId}/starbases/{starbaseId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'starbaseId'],
    queryParams: { systemId: 'system_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdStructures
  // Get a list of corporation structures. This route's version includes the changes to structures detail
  GetCorporationsCorporationIdStructures: {
    path: 'corporations/{corporationId}/structures',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdTitles
  // Returns a corporation's titles
  GetCorporationsCorporationIdTitles: {
    path: 'corporations/{corporationId}/titles',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsNpccorps
  // Get a list of npc corporations
  GetCorporationsNpccorps: {
    path: 'corporations/npccorps',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Corporation Projects ---

export const corporationProjectsEndpointScaffold = {
  // GetCorporationsProjectsContribution
  // Show your contribution to a corporation project.
  GetCorporationsProjectsContribution: {
    path: 'corporations/{corporationId}/projects/{projectId}/contribution/{characterId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'projectId', 'characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsProjectsContributors
  // Listing of all contributors to a corporation project.
  GetCorporationsProjectsContributors: {
    path: 'corporations/{corporationId}/projects/{projectId}/contributors',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'projectId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsProjectsDetail
  // Get the details of a corporation project.
  GetCorporationsProjectsDetail: {
    path: 'corporations/{corporationId}/projects/{projectId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'projectId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsProjectsListing
  // Listing of all (active) corporation projects.
  GetCorporationsProjectsListing: {
    path: 'corporations/{corporationId}/projects',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit', state: 'state' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Dogma ---

export const dogmaEndpointScaffold = {
  // GetDogmaAttributes
  // Get a list of dogma attribute ids
  GetDogmaAttributes: {
    path: 'dogma/attributes',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetDogmaAttributesAttributeId
  // Get information on a dogma attribute
  GetDogmaAttributesAttributeId: {
    path: 'dogma/attributes/{attributeId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['attributeId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetDogmaDynamicItemsTypeIdItemId
  // Returns info about a dynamic item resulting from mutation with a mutaplasmid.
  GetDogmaDynamicItemsTypeIdItemId: {
    path: 'dogma/dynamic/items/{typeId}/{itemId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['itemId', 'typeId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetDogmaEffects
  // Get a list of dogma effect ids
  GetDogmaEffects: {
    path: 'dogma/effects',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetDogmaEffectsEffectId
  // Get information on a dogma effect
  GetDogmaEffectsEffectId: {
    path: 'dogma/effects/{effectId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['effectId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Faction Warfare ---

export const factionWarfareEndpointScaffold = {
  // GetCharactersCharacterIdFwStats
  // Statistical overview of a character involved in faction warfare
  GetCharactersCharacterIdFwStats: {
    path: 'characters/{characterId}/fw/stats',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdFwStats
  // Statistics about a corporation involved in faction warfare
  GetCorporationsCorporationIdFwStats: {
    path: 'corporations/{corporationId}/fw/stats',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFwLeaderboards
  // Top 4 leaderboard of factions for kills and victory points separated by total, last week and yesterd
  GetFwLeaderboards: {
    path: 'fw/leaderboards',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFwLeaderboardsCharacters
  // Top 100 leaderboard of pilots for kills and victory points separated by total, last week and yesterd
  GetFwLeaderboardsCharacters: {
    path: 'fw/leaderboards/characters',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFwLeaderboardsCorporations
  // Top 10 leaderboard of corporations for kills and victory points separated by total, last week and ye
  GetFwLeaderboardsCorporations: {
    path: 'fw/leaderboards/corporations',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFwStats
  // Statistical overviews of factions involved in faction warfare
  GetFwStats: {
    path: 'fw/stats',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFwSystems
  // An overview of the current ownership of faction warfare solar systems
  GetFwSystems: {
    path: 'fw/systems',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFwWars
  // Data about which NPC factions are at war
  GetFwWars: {
    path: 'fw/wars',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Fittings ---

export const fittingsEndpointScaffold = {
  // DeleteCharactersCharacterIdFittingsFittingId
  // Delete a fitting from a character
  DeleteCharactersCharacterIdFittingsFittingId: {
    path: 'characters/{characterId}/fittings/{fittingId}',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['characterId', 'fittingId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdFittings
  // Return fittings of a character
  GetCharactersCharacterIdFittings: {
    path: 'characters/{characterId}/fittings',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCharactersCharacterIdFittings
  // Save a new fitting for a character
  PostCharactersCharacterIdFittings: {
    path: 'characters/{characterId}/fittings',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Fleets ---

export const fleetsEndpointScaffold = {
  // DeleteFleetsFleetIdMembersMemberId
  // Kick a fleet member
  DeleteFleetsFleetIdMembersMemberId: {
    path: 'fleets/{fleetId}/members/{memberId}',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['fleetId', 'memberId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // DeleteFleetsFleetIdSquadsSquadId
  // Delete a fleet squad, only empty squads can be deleted
  DeleteFleetsFleetIdSquadsSquadId: {
    path: 'fleets/{fleetId}/squads/{squadId}',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['fleetId', 'squadId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // DeleteFleetsFleetIdWingsWingId
  // Delete a fleet wing, only empty wings can be deleted. The wing may contain squads, but the squads mu
  DeleteFleetsFleetIdWingsWingId: {
    path: 'fleets/{fleetId}/wings/{wingId}',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['fleetId', 'wingId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdFleet
  // Return the fleet ID the character is in, if any.
  GetCharactersCharacterIdFleet: {
    path: 'characters/{characterId}/fleet',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFleetsFleetId
  // Return details about a fleet
  GetFleetsFleetId: {
    path: 'fleets/{fleetId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['fleetId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFleetsFleetIdMembers
  // Return information about fleet members
  GetFleetsFleetIdMembers: {
    path: 'fleets/{fleetId}/members',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['fleetId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFleetsFleetIdWings
  // Return information about wings in a fleet
  GetFleetsFleetIdWings: {
    path: 'fleets/{fleetId}/wings',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['fleetId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostFleetsFleetIdMembers
  // Invite a character into the fleet. If a character has a CSPA charge set it is not possible to invite
  PostFleetsFleetIdMembers: {
    path: 'fleets/{fleetId}/members',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['fleetId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostFleetsFleetIdWings
  // Create a new wing in a fleet
  PostFleetsFleetIdWings: {
    path: 'fleets/{fleetId}/wings',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['fleetId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostFleetsFleetIdWingsWingIdSquads
  // Create a new squad in a fleet
  PostFleetsFleetIdWingsWingIdSquads: {
    path: 'fleets/{fleetId}/wings/{wingId}/squads',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['fleetId', 'wingId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PutFleetsFleetId
  // Update settings about a fleet
  PutFleetsFleetId: {
    path: 'fleets/{fleetId}',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['fleetId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PutFleetsFleetIdMembersMemberId
  // Move a fleet member around
  PutFleetsFleetIdMembersMemberId: {
    path: 'fleets/{fleetId}/members/{memberId}',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['fleetId', 'memberId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PutFleetsFleetIdSquadsSquadId
  // Rename a fleet squad
  PutFleetsFleetIdSquadsSquadId: {
    path: 'fleets/{fleetId}/squads/{squadId}',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['fleetId', 'squadId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PutFleetsFleetIdWingsWingId
  // Rename a fleet wing
  PutFleetsFleetIdWingsWingId: {
    path: 'fleets/{fleetId}/wings/{wingId}',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['fleetId', 'wingId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Freelance Jobs ---

export const freelanceJobsEndpointScaffold = {
  // GetCharactersFreelanceJobsListing
  // Listing of all freelance jobs you are actively participating in.
  GetCharactersFreelanceJobsListing: {
    path: 'characters/{characterId}/freelance-jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersFreelanceJobsParticipation
  // Show your participation in a freelance job.
  GetCharactersFreelanceJobsParticipation: {
    path: 'characters/{characterId}/freelance-jobs/{jobId}/participation',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'jobId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsFreelanceJobsListing
  // Listing of all freelance jobs for your corporation.
  GetCorporationsFreelanceJobsListing: {
    path: 'corporations/{corporationId}/freelance-jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsFreelanceJobsParticipants
  // Listing of all participants of a freelance job.
  GetCorporationsFreelanceJobsParticipants: {
    path: 'corporations/{corporationId}/freelance-jobs/{jobId}/participants',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'jobId'],
    queryParams: { after: 'after', before: 'before', limit: 'limit' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFreelanceJobsDetail
  // Get the details of a freelance job.
  GetFreelanceJobsDetail: {
    path: 'freelance-jobs/{jobId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['jobId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetFreelanceJobsListing
  // Listing of all public freelance jobs.
  GetFreelanceJobsListing: {
    path: 'freelance-jobs',
    method: 'GET',
    requiresAuth: false,
    queryParams: { after: 'after', before: 'before', limit: 'limit', corporationId: 'corporation_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Incursions ---

export const incursionsEndpointScaffold = {
  // GetIncursions
  // Return a list of current incursions
  GetIncursions: {
    path: 'incursions',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Industry ---

export const industryEndpointScaffold = {
  // GetCharactersCharacterIdIndustryJobs
  // List industry jobs placed by a character
  GetCharactersCharacterIdIndustryJobs: {
    path: 'characters/{characterId}/industry/jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { includeCompleted: 'include_completed' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdMining
  // Paginated record of all mining done by a character for the past 30 days
  GetCharactersCharacterIdMining: {
    path: 'characters/{characterId}/mining',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationCorporationIdMiningExtractions
  // Extraction timers for all moon chunks being extracted by refineries belonging to a corporation.
  GetCorporationCorporationIdMiningExtractions: {
    path: 'corporation/{corporationId}/mining/extractions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationCorporationIdMiningObservers
  // Paginated list of all entities capable of observing and recording mining for a corporation
  GetCorporationCorporationIdMiningObservers: {
    path: 'corporation/{corporationId}/mining/observers',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationCorporationIdMiningObserversObserverId
  // Paginated record of all mining seen by an observer
  GetCorporationCorporationIdMiningObserversObserverId: {
    path: 'corporation/{corporationId}/mining/observers/{observerId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'observerId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdIndustryJobs
  // List industry jobs run by a corporation
  GetCorporationsCorporationIdIndustryJobs: {
    path: 'corporations/{corporationId}/industry/jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    queryParams: { includeCompleted: 'include_completed' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetIndustryFacilities
  // Return a list of industry facilities
  GetIndustryFacilities: {
    path: 'industry/facilities',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetIndustrySystems
  // Return cost indices for solar systems
  GetIndustrySystems: {
    path: 'industry/systems',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Insurance ---

export const insuranceEndpointScaffold = {
  // GetInsurancePrices
  // Return available insurance levels for all ship types
  GetInsurancePrices: {
    path: 'insurance/prices',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Killmails ---

export const killmailsEndpointScaffold = {
  // GetCharactersCharacterIdKillmailsRecent
  // Return a list of a character's kills and losses going back 90 days
  GetCharactersCharacterIdKillmailsRecent: {
    path: 'characters/{characterId}/killmails/recent',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdKillmailsRecent
  // Get a list of a corporation's kills and losses going back 90 days
  GetCorporationsCorporationIdKillmailsRecent: {
    path: 'corporations/{corporationId}/killmails/recent',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetKillmailsKillmailIdKillmailHash
  // Return a single killmail from its ID and hash
  GetKillmailsKillmailIdKillmailHash: {
    path: 'killmails/{killmailId}/{killmailHash}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['killmailHash', 'killmailId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Location ---

export const locationEndpointScaffold = {
  // GetCharactersCharacterIdLocation
  // Information about the characters current location. Returns the current solar system id, and also the
  GetCharactersCharacterIdLocation: {
    path: 'characters/{characterId}/location',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdOnline
  // Checks if the character is currently online
  GetCharactersCharacterIdOnline: {
    path: 'characters/{characterId}/online',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdShip
  // Get the current ship type, name and id
  GetCharactersCharacterIdShip: {
    path: 'characters/{characterId}/ship',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Loyalty ---

export const loyaltyEndpointScaffold = {
  // GetCharactersCharacterIdLoyaltyPoints
  // Return a list of loyalty points for all corporations the character has worked for
  GetCharactersCharacterIdLoyaltyPoints: {
    path: 'characters/{characterId}/loyalty/points',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetLoyaltyStoresCorporationIdOffers
  // Return a list of offers from a specific corporation's loyalty store
  GetLoyaltyStoresCorporationIdOffers: {
    path: 'loyalty/stores/{corporationId}/offers',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Mail ---

export const mailEndpointScaffold = {
  // DeleteCharactersCharacterIdMailLabelsLabelId
  // Delete a mail label
  DeleteCharactersCharacterIdMailLabelsLabelId: {
    path: 'characters/{characterId}/mail/labels/{labelId}',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['characterId', 'labelId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // DeleteCharactersCharacterIdMailMailId
  // Delete a mail
  DeleteCharactersCharacterIdMailMailId: {
    path: 'characters/{characterId}/mail/{mailId}',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['characterId', 'mailId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdMail
  // Return the 50 most recent mail headers belonging to the character that match the query criteria. Que
  GetCharactersCharacterIdMail: {
    path: 'characters/{characterId}/mail',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { labels: 'labels', lastMailId: 'last_mail_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdMailLabels
  // Return a list of the users mail labels, unread counts for each label and a total unread count.
  GetCharactersCharacterIdMailLabels: {
    path: 'characters/{characterId}/mail/labels',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdMailLists
  // Return all mailing lists that the character is subscribed to
  GetCharactersCharacterIdMailLists: {
    path: 'characters/{characterId}/mail/lists',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdMailMailId
  // Return the contents of an EVE mail
  GetCharactersCharacterIdMailMailId: {
    path: 'characters/{characterId}/mail/{mailId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'mailId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCharactersCharacterIdMail
  // Create and send a new mail
  PostCharactersCharacterIdMail: {
    path: 'characters/{characterId}/mail',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostCharactersCharacterIdMailLabels
  // Create a mail label
  PostCharactersCharacterIdMailLabels: {
    path: 'characters/{characterId}/mail/labels',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PutCharactersCharacterIdMailMailId
  // Update metadata about a mail
  PutCharactersCharacterIdMailMailId: {
    path: 'characters/{characterId}/mail/{mailId}',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['characterId', 'mailId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Market ---

export const marketEndpointScaffold = {
  // GetCharactersCharacterIdOrders
  // List open market orders placed by a character
  GetCharactersCharacterIdOrders: {
    path: 'characters/{characterId}/orders',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdOrdersHistory
  // List cancelled and expired market orders placed by a character up to 90 days in the past.
  GetCharactersCharacterIdOrdersHistory: {
    path: 'characters/{characterId}/orders/history',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdOrders
  // List open market orders placed on behalf of a corporation
  GetCorporationsCorporationIdOrders: {
    path: 'corporations/{corporationId}/orders',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdOrdersHistory
  // List cancelled and expired market orders placed on behalf of a corporation up to 90 days in the past
  GetCorporationsCorporationIdOrdersHistory: {
    path: 'corporations/{corporationId}/orders/history',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetMarketsGroups
  // Get a list of item groups
  GetMarketsGroups: {
    path: 'markets/groups',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetMarketsGroupsMarketGroupId
  // Get information on an item group
  GetMarketsGroupsMarketGroupId: {
    path: 'markets/groups/{marketGroupId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['marketGroupId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetMarketsPrices
  // Return a list of prices
  GetMarketsPrices: {
    path: 'markets/prices',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetMarketsRegionIdHistory
  // Return a list of historical market statistics for the specified type in a region
  GetMarketsRegionIdHistory: {
    path: 'markets/{regionId}/history',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    queryParams: { typeId: 'type_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetMarketsRegionIdOrders
  // Return a list of orders in a region
  GetMarketsRegionIdOrders: {
    path: 'markets/{regionId}/orders',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    queryParams: { orderType: 'order_type', typeId: 'type_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetMarketsRegionIdTypes
  // Return a list of type IDs that have active orders in the region, for efficient market indexing.
  GetMarketsRegionIdTypes: {
    path: 'markets/{regionId}/types',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetMarketsStructuresStructureId
  // Return all orders in a structure
  GetMarketsStructuresStructureId: {
    path: 'markets/structures/{structureId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['structureId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Meta ---

export const metaEndpointScaffold = {
  // GetMetaChangelog
  // Get the changelog of this API.
  GetMetaChangelog: {
    path: 'meta/changelog',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetMetaCompatibilityDates
  // Get a list of compatibility dates.
  GetMetaCompatibilityDates: {
    path: 'meta/compatibility-dates',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetMetaStatus
  // Get the health status of each API route.
  GetMetaStatus: {
    path: 'meta/status',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Planetary Interaction ---

export const planetaryInteractionEndpointScaffold = {
  // GetCharactersCharacterIdPlanets
  // Returns a list of all planetary colonies owned by a character.
  GetCharactersCharacterIdPlanets: {
    path: 'characters/{characterId}/planets',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdPlanetsPlanetId
  // Returns full details on the layout of a single planetary colony, including links, pins and routes. N
  GetCharactersCharacterIdPlanetsPlanetId: {
    path: 'characters/{characterId}/planets/{planetId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'planetId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdCustomsOffices
  // List customs offices owned by a corporation
  GetCorporationsCorporationIdCustomsOffices: {
    path: 'corporations/{corporationId}/customs_offices',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseSchematicsSchematicId
  // Get information on a planetary factory schematic
  GetUniverseSchematicsSchematicId: {
    path: 'universe/schematics/{schematicId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['schematicId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Routes ---

export const routesEndpointScaffold = {
  // PostRoute
  // Calculate the systems between the given origin and destination.
  PostRoute: {
    path: 'route/{originSystemId}/{destinationSystemId}',
    method: 'POST',
    requiresAuth: false,
    pathParams: ['originSystemId', 'destinationSystemId'],
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Search ---

export const searchEndpointScaffold = {
  // GetCharactersCharacterIdSearch
  // Search for entities that match a given sub-string.
  GetCharactersCharacterIdSearch: {
    path: 'characters/{characterId}/search',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { categories: 'categories', search: 'search', strict: 'strict' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Skills ---

export const skillsEndpointScaffold = {
  // GetCharactersCharacterIdAttributes
  // Return attributes of a character
  GetCharactersCharacterIdAttributes: {
    path: 'characters/{characterId}/attributes',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdSkillqueue
  // List the configured skill queue for the given character.
  GetCharactersCharacterIdSkillqueue: {
    path: 'characters/{characterId}/skillqueue',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdSkills
  // List all trained skills for the given character.
  GetCharactersCharacterIdSkills: {
    path: 'characters/{characterId}/skills',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Sovereignty ---

export const sovereigntyEndpointScaffold = {
  // GetSovereigntyCampaigns
  // Shows sovereignty data for campaigns.
  GetSovereigntyCampaigns: {
    path: 'sovereignty/campaigns',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetSovereigntyMap
  // Shows sovereignty information for solar systems
  GetSovereigntyMap: {
    path: 'sovereignty/map',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetSovereigntyStructures
  // Shows sovereignty data for structures.
  GetSovereigntyStructures: {
    path: 'sovereignty/structures',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Status ---

export const statusEndpointScaffold = {
  // GetStatus
  // Current status of the EVE Online cluster
  GetStatus: {
    path: 'status',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Universe ---

export const universeEndpointScaffold = {
  // GetUniverseAncestries
  // Get all character ancestries
  GetUniverseAncestries: {
    path: 'universe/ancestries',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseAsteroidBeltsAsteroidBeltId
  // Get information on an asteroid belt
  GetUniverseAsteroidBeltsAsteroidBeltId: {
    path: 'universe/asteroid_belts/{asteroidBeltId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['asteroidBeltId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseBloodlines
  // Get a list of bloodlines
  GetUniverseBloodlines: {
    path: 'universe/bloodlines',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseCategories
  // Get a list of item categories
  GetUniverseCategories: {
    path: 'universe/categories',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseCategoriesCategoryId
  // Get information of an item category
  GetUniverseCategoriesCategoryId: {
    path: 'universe/categories/{categoryId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['categoryId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseConstellations
  // Get a list of constellations
  GetUniverseConstellations: {
    path: 'universe/constellations',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseConstellationsConstellationId
  // Get information on a constellation
  GetUniverseConstellationsConstellationId: {
    path: 'universe/constellations/{constellationId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['constellationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseFactions
  // Get a list of factions
  GetUniverseFactions: {
    path: 'universe/factions',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseGraphics
  // Get a list of graphics
  GetUniverseGraphics: {
    path: 'universe/graphics',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseGraphicsGraphicId
  // Get information on a graphic
  GetUniverseGraphicsGraphicId: {
    path: 'universe/graphics/{graphicId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['graphicId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseGroups
  // Get a list of item groups
  GetUniverseGroups: {
    path: 'universe/groups',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseGroupsGroupId
  // Get information on an item group
  GetUniverseGroupsGroupId: {
    path: 'universe/groups/{groupId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['groupId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseMoonsMoonId
  // Get information on a moon
  GetUniverseMoonsMoonId: {
    path: 'universe/moons/{moonId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['moonId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniversePlanetsPlanetId
  // Get information on a planet
  GetUniversePlanetsPlanetId: {
    path: 'universe/planets/{planetId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['planetId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseRaces
  // Get a list of character races
  GetUniverseRaces: {
    path: 'universe/races',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseRegions
  // Get a list of regions
  GetUniverseRegions: {
    path: 'universe/regions',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseRegionsRegionId
  // Get information on a region
  GetUniverseRegionsRegionId: {
    path: 'universe/regions/{regionId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseStargatesStargateId
  // Get information on a stargate
  GetUniverseStargatesStargateId: {
    path: 'universe/stargates/{stargateId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['stargateId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseStarsStarId
  // Get information on a star
  GetUniverseStarsStarId: {
    path: 'universe/stars/{starId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['starId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseStationsStationId
  // Get information on a station
  GetUniverseStationsStationId: {
    path: 'universe/stations/{stationId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['stationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseStructures
  // List all public structures
  GetUniverseStructures: {
    path: 'universe/structures',
    method: 'GET',
    requiresAuth: false,
    queryParams: { filter: 'filter' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseStructuresStructureId
  // Returns information on requested structure if you are on the ACL. Otherwise, returns "Forbidden" for
  GetUniverseStructuresStructureId: {
    path: 'universe/structures/{structureId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['structureId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseSystemJumps
  // Get the number of jumps in solar systems within the last hour ending at the timestamp of the Last-Mo
  GetUniverseSystemJumps: {
    path: 'universe/system_jumps',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseSystemKills
  // Get the number of ship, pod and NPC kills per solar system within the last hour ending at the timest
  GetUniverseSystemKills: {
    path: 'universe/system_kills',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseSystems
  // Get a list of solar systems
  GetUniverseSystems: {
    path: 'universe/systems',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseSystemsSystemId
  // Get information on a solar system.
  GetUniverseSystemsSystemId: {
    path: 'universe/systems/{systemId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['systemId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseTypes
  // Get a list of type ids
  GetUniverseTypes: {
    path: 'universe/types',
    method: 'GET',
    requiresAuth: false,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetUniverseTypesTypeId
  // Get information on a type
  GetUniverseTypesTypeId: {
    path: 'universe/types/{typeId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['typeId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostUniverseIds
  // Resolve a set of names to IDs in the following categories: agents, alliances, characters, constellat
  PostUniverseIds: {
    path: 'universe/ids',
    method: 'POST',
    requiresAuth: false,
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostUniverseNames
  // Resolve a set of IDs to names and categories. Supported ID's for resolving are: Characters, Corporat
  PostUniverseNames: {
    path: 'universe/names',
    method: 'POST',
    requiresAuth: false,
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- User Interface ---

export const userInterfaceEndpointScaffold = {
  // PostUiAutopilotWaypoint
  // Set a solar system as autopilot waypoint
  PostUiAutopilotWaypoint: {
    path: 'ui/autopilot/waypoint',
    method: 'POST',
    requiresAuth: true,
    queryParams: { addToBeginning: 'add_to_beginning', clearOtherWaypoints: 'clear_other_waypoints', destinationId: 'destination_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostUiOpenwindowContract
  // Open the contract window inside the client
  PostUiOpenwindowContract: {
    path: 'ui/openwindow/contract',
    method: 'POST',
    requiresAuth: true,
    queryParams: { contractId: 'contract_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostUiOpenwindowInformation
  // Open the information window for a character, corporation or alliance inside the client
  PostUiOpenwindowInformation: {
    path: 'ui/openwindow/information',
    method: 'POST',
    requiresAuth: true,
    queryParams: { targetId: 'target_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostUiOpenwindowMarketdetails
  // Open the market details window for a specific typeID inside the client
  PostUiOpenwindowMarketdetails: {
    path: 'ui/openwindow/marketdetails',
    method: 'POST',
    requiresAuth: true,
    queryParams: { typeId: 'type_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // PostUiOpenwindowNewmail
  // Open the New Mail window, according to settings from the request if applicable
  PostUiOpenwindowNewmail: {
    path: 'ui/openwindow/newmail',
    method: 'POST',
    requiresAuth: true,
    hasBody: true,
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Wallet ---

export const walletEndpointScaffold = {
  // GetCharactersCharacterIdWallet
  // Returns a character's wallet balance
  GetCharactersCharacterIdWallet: {
    path: 'characters/{characterId}/wallet',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdWalletJournal
  // Retrieve the given character's wallet journal going 30 days back
  GetCharactersCharacterIdWalletJournal: {
    path: 'characters/{characterId}/wallet/journal',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCharactersCharacterIdWalletTransactions
  // Get wallet transactions of a character
  GetCharactersCharacterIdWalletTransactions: {
    path: 'characters/{characterId}/wallet/transactions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { fromId: 'from_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdWallets
  // Get a corporation's wallets
  GetCorporationsCorporationIdWallets: {
    path: 'corporations/{corporationId}/wallets',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdWalletsDivisionJournal
  // Retrieve the given corporation's wallet journal for the given division going 30 days back
  GetCorporationsCorporationIdWalletsDivisionJournal: {
    path: 'corporations/{corporationId}/wallets/{division}/journal',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'division'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetCorporationsCorporationIdWalletsDivisionTransactions
  // Get wallet transactions of a corporation
  GetCorporationsCorporationIdWalletsDivisionTransactions: {
    path: 'corporations/{corporationId}/wallets/{division}/transactions',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'division'],
    queryParams: { fromId: 'from_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Wars ---

export const warsEndpointScaffold = {
  // GetWars
  // Return a list of wars
  GetWars: {
    path: 'wars',
    method: 'GET',
    requiresAuth: false,
    queryParams: { maxWarId: 'max_war_id' },
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetWarsWarId
  // Return details about a war
  GetWarsWarId: {
    path: 'wars/{warId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['warId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
  // GetWarsWarIdKillmails
  // Return a list of kills related to a war
  GetWarsWarIdKillmails: {
    path: 'wars/{warId}/killmails',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['warId'],
    // responseSchema: TODO — wire hand-written Zod schema
  },
} as const satisfies EndpointMap;

// --- Coverage Summary ---
//
// Total tags: 33
// Total operations: 208
//   Alliance: 4 operations
//   Assets: 6 operations
//   Calendar: 4 operations
//   Character: 14 operations
//   Clones: 2 operations
//   Contacts: 9 operations
//   Contracts: 9 operations
//   Corporation: 22 operations
//   Corporation Projects: 4 operations
//   Dogma: 5 operations
//   Faction Warfare: 8 operations
//   Fittings: 3 operations
//   Fleets: 14 operations
//   Freelance Jobs: 6 operations
//   Incursions: 1 operations
//   Industry: 8 operations
//   Insurance: 1 operations
//   Killmails: 3 operations
//   Location: 3 operations
//   Loyalty: 2 operations
//   Mail: 9 operations
//   Market: 11 operations
//   Meta: 3 operations
//   Planetary Interaction: 4 operations
//   Routes: 1 operations
//   Search: 1 operations
//   Skills: 3 operations
//   Sovereignty: 3 operations
//   Status: 1 operations
//   Universe: 30 operations
//   User Interface: 5 operations
//   Wallet: 6 operations
//   Wars: 3 operations
