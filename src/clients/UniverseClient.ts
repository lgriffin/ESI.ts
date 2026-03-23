import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { universeEndpoints } from '../core/endpoints/universeEndpoints';
import { Ancestry, Bloodline, ConstellationInfo, Faction, Race, RegionInfo, SolarSystemInfo, StationInfo, TypeInfo } from '../types/api-responses';

export class UniverseClient {
    private api: ReturnType<typeof createClient<typeof universeEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, universeEndpoints);
    }

    async getAncestries(): Promise<Ancestry[]> {
        return this.api.getAncestries();
    }

    async getAsteroidBeltInfo(asteroidBeltId: number): Promise<any> {
        return this.api.getAsteroidBeltInfo(asteroidBeltId);
    }

    async getBloodlines(): Promise<Bloodline[]> {
        return this.api.getBloodlines();
    }

    async getConstellationById(constellationId: number): Promise<ConstellationInfo> {
        return this.api.getConstellationById(constellationId);
    }

    async getConstellations(): Promise<number[]> {
        return this.api.getConstellations();
    }

    async getFactions(): Promise<Faction[]> {
        return this.api.getFactions();
    }

    async getGraphicById(graphicId: number): Promise<any> {
        return this.api.getGraphicById(graphicId);
    }

    async getGraphics(): Promise<number[]> {
        return this.api.getGraphics();
    }

    async getItemCategories(): Promise<number[]> {
        return this.api.getCategories();
    }

    async getItemCategoryById(categoryId: number): Promise<any> {
        return this.api.getCategoryById(categoryId);
    }

    async getItemGroupById(groupId: number): Promise<any> {
        return this.api.getItemGroupById(groupId);
    }

    async getItemGroups(): Promise<number[]> {
        return this.api.getItemGroups();
    }

    async getMoonById(moonId: number): Promise<any> {
        return this.api.getMoonById(moonId);
    }

    async getPlanetById(planetId: number): Promise<any> {
        return this.api.getPlanetById(planetId);
    }

    async getRaces(): Promise<Race[]> {
        return this.api.getRaces();
    }

    async getRegionById(regionId: number): Promise<RegionInfo> {
        return this.api.getRegionById(regionId);
    }

    async getStarById(starId: number): Promise<any> {
        return this.api.getStarById(starId);
    }

    async getStargateById(stargateId: number): Promise<any> {
        return this.api.getStargateById(stargateId);
    }

    async getStationById(stationId: number): Promise<StationInfo> {
        return this.api.getStationById(stationId);
    }

    async getStructureById(structureId: number): Promise<any> {
        return this.api.getStructureById(structureId);
    }

    async getStructures(): Promise<number[]> {
        return this.api.getStructures();
    }

    async getSystemById(systemId: number): Promise<SolarSystemInfo> {
        return this.api.getSystemById(systemId);
    }

    async getSystemJumps(): Promise<any> {
        return this.api.getSystemJumps();
    }

    async getSystemKills(): Promise<any> {
        return this.api.getSystemKills();
    }

    async getSystems(): Promise<number[]> {
        return this.api.getSystems();
    }

    async getTypeById(typeId: number): Promise<TypeInfo> {
        return this.api.getTypeById(typeId);
    }

    async getTypes(): Promise<number[]> {
        return this.api.getTypes();
    }

    async postBulkNamesToIds(ids: number[]): Promise<any> {
        return this.api.postBulkNamesToIds(ids);
    }

    async postNamesAndCategories(ids: number[]): Promise<any> {
        return this.api.postNamesAndCategories(ids);
    }

    async getSchematicById(schematicId: number): Promise<any> {
        return this.api.getSchematicById(schematicId);
    }

    async getRegions(): Promise<number[]> {
        return this.api.getRegions();
    }
}
