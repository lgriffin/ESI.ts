/**
 * SDE domain: factions, races, bloodlines, ancestries, character reference tables, skills and NPC characters.
 *
 * Types for the tables of this domain; the Zod schemas that validate them
 * are in ./schemas.ts (split out of the former src/sde/types.ts, Track S
 * Run 12).
 */

/** eve_agent_types [13 rows] */
export interface AgentType {
  agentTypeId: number;
  name: string;
}

/** eve_agents_in_space [360 rows] */
export interface AgentInSpace {
  characterId: number;
  dungeonId: number;
  solarSystemId: number;
  spawnPointId: number;
  typeId: number;
}

/** eve_ancestries [43 rows] */
export interface Ancestry {
  ancestryId: number;
  bloodlineId: number;
  charisma: number;
  description: string;
  iconId: number;
  intelligence: number;
  memory: number;
  name: string;
  perception: number;
  shortDescription: string;
  willpower: number;
}

/** eve_bloodlines [18 rows] */
export interface Bloodline {
  bloodlineId: number;
  charisma: number;
  corporationId: number;
  description: string;
  iconId: number;
  intelligence: number;
  memory: number;
  name: string;
  perception: number;
  raceId: number;
  willpower: number;
}

/** eve_certificates [139 rows] */
export interface Certificate {
  certificateId: number;
  description: string;
  groupId: number;
  name: string;
  recommendedFor: unknown;
  skillTypes: unknown;
}

/** eve_character_attributes [5 rows] */
export interface CharacterAttribute {
  attributeId: number;
  description: string;
  iconId: number;
  name: string;
  notes: string;
  shortDescription: string;
}

/** eve_character_titles [43 rows] */
export interface CharacterTitle {
  name: string;
}

/** eve_clone_grades [4 rows] */
export interface CloneGrade {
  cloneGradeId: number;
  name: string;
  skills: unknown;
}

/** eve_expert_systems [55 rows] */
export interface ExpertSystem {
  expertSystemId: number;
  durationDays: number;
  hidden: boolean;
  internalName: string;
  retired: boolean;
  skillsGranted: unknown;
  associatedShipTypes: unknown;
}

/** eve_factions [27 rows] */
export interface Faction {
  factionId: number;
  corporationId: number;
  description: string;
  flatLogo: string;
  flatLogoWithName: string;
  iconId: number;
  memberRaces: number[];
  militiaCorporationId: number;
  name: string;
  shortDescription: string;
  sizeFactor: number;
  solarSystemId: number;
  uniqueName: boolean;
}

/** eve_npc_characters [11393 rows] */
export interface NpcCharacter {
  characterId: number;
  bloodlineId: number;
  ceo: boolean;
  corporationId: number;
  gender: number;
  locationId: number;
  name: string;
  raceId: number;
  startDate: string;
  uniqueName: boolean;
  skills: unknown;
  ancestryId: number | null;
  careerId: number | null;
  schoolId: number | null;
  specialityId: number | null;
}

/** eve_races [11 rows] */
export interface Race {
  raceId: number;
  description: string;
  iconId: number;
  name: string;
  shipTypeId: number;
  skills: unknown;
}

/** eve_school_map [12 rows] */
export interface SchoolMap {
  schoolMapId: number;
  schoolId: number;
  solarSystemId: number;
}

/** eve_schools [23 rows] */
export interface School {
  schoolId: number;
  careerAgents: unknown;
  careerId: number;
  characterDescription: string;
  corporationId: number;
  description: string;
  iconId: number;
  name: string;
  raceId: number;
  startingStations: unknown;
  title: string;
  isStarterSpaceSchool: string | null;
}

/** eve_skill_plans [40 rows] */
export interface SkillPlan {
  skillPlanId: number;
  careerPathId: number;
  description: string;
  factionId: number;
  internalName: string;
  milestones: unknown;
  name: string;
  skillRequirements: unknown;
  npcCorporationDivision: string | null;
}
