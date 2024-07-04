import { ApiClient } from '../core/ApiClient';
import { UniverseAncestriesApi } from '../api/universe/getAncestries';
import { UniverseAsteroidBeltApi } from '../api/universe/getAsteroidBeltInfo';
import { UniverseBloodlinesApi } from '../api/universe/getBloodlines';
import { UniverseConstellationByIdApi } from '../api/universe/getConstellationById';
import { UniverseConstellationsApi } from '../api/universe/getConstellations';
import { UniverseFactionsApi } from '../api/universe/getFactions';
import { UniverseGraphicByIdApi } from '../api/universe/getGraphicById';
import { UniverseGraphicsApi } from '../api/universe/getGraphics';
import { UniverseCategoriesApi } from '../api/universe/getItemCategories';
import { UniverseCategoryByIdApi } from '../api/universe/getItemCategoryById';
import { UniverseItemGroupByIdApi } from '../api/universe/getItemGroupById';
import { UniverseItemGroupsApi } from '../api/universe/getItemGroups';
import { UniverseMoonByIdApi } from '../api/universe/getMoonById';
import { UniversePlanetByIdApi } from '../api/universe/getPlanetById';
import { UniverseRacesApi } from '../api/universe/getRaces';
import { UniverseRegionByIdApi } from '../api/universe/getRegionById';
import { UniverseStarByIdApi } from '../api/universe/getStarById';
import { UniverseStargateByIdApi } from '../api/universe/getStargateById';
import { UniverseStationByIdApi } from '../api/universe/getStationById';
import { UniverseStructureByIdApi } from '../api/universe/getStructureById';
import { UniverseStructuresApi } from '../api/universe/getStructures';
import { UniverseSystemByIdApi } from '../api/universe/getSystemById';
import { UniverseSystemJumpsApi } from '../api/universe/getSystemJumps';
import { UniverseSystemKillsApi } from '../api/universe/getSystemKills';
import { UniverseSystemsApi } from '../api/universe/getSystems';
import { UniverseTypeByIdApi } from '../api/universe/getTypeById';
import { UniverseTypesApi } from '../api/universe/getTypes';
import { PostBulkNamesToIdsApi } from '../api/universe/postBulkNamesToIds';
import { PostNamesAndCategoriesApi } from '../api/universe/postNamesAndCategories';

export class UniverseClient {
    private universeAncestriesApi: UniverseAncestriesApi;
    private universeAsteroidBeltApi: UniverseAsteroidBeltApi;
    private universeBloodlinesApi: UniverseBloodlinesApi;
    private universeConstellationByIdApi: UniverseConstellationByIdApi;
    private universeConstellationsApi: UniverseConstellationsApi;
    private universeFactionsApi: UniverseFactionsApi;
    private universeGraphicByIdApi: UniverseGraphicByIdApi;
    private universeGraphicsApi: UniverseGraphicsApi;
    private universeCategoriesApi: UniverseCategoriesApi;
    private universeCategoryByIdApi: UniverseCategoryByIdApi;
    private universeItemGroupByIdApi: UniverseItemGroupByIdApi;
    private universeItemGroupsApi: UniverseItemGroupsApi;
    private universeMoonByIdApi: UniverseMoonByIdApi;
    private universePlanetByIdApi: UniversePlanetByIdApi;
    private universeRacesApi: UniverseRacesApi;
    private universeRegionByIdApi: UniverseRegionByIdApi;
    private universeStarByIdApi: UniverseStarByIdApi;
    private universeStargateByIdApi: UniverseStargateByIdApi;
    private universeStationByIdApi: UniverseStationByIdApi;
    private universeStructureByIdApi: UniverseStructureByIdApi;
    private universeStructuresApi: UniverseStructuresApi;
    private universeSystemByIdApi: UniverseSystemByIdApi;
    private universeSystemJumpsApi: UniverseSystemJumpsApi;
    private universeSystemKillsApi: UniverseSystemKillsApi;
    private universeSystemsApi: UniverseSystemsApi;
    private universeTypeByIdApi: UniverseTypeByIdApi;
    private universeTypesApi: UniverseTypesApi;
    private postBulkNamesToIdsApi: PostBulkNamesToIdsApi;
    private postNamesAndCategoriesApi: PostNamesAndCategoriesApi;

    constructor(client: ApiClient) {
        this.universeAncestriesApi = new UniverseAncestriesApi(client);
        this.universeAsteroidBeltApi = new UniverseAsteroidBeltApi(client);
        this.universeBloodlinesApi = new UniverseBloodlinesApi(client);
        this.universeConstellationByIdApi = new UniverseConstellationByIdApi(client);
        this.universeConstellationsApi = new UniverseConstellationsApi(client);
        this.universeFactionsApi = new UniverseFactionsApi(client);
        this.universeGraphicByIdApi = new UniverseGraphicByIdApi(client);
        this.universeGraphicsApi = new UniverseGraphicsApi(client);
        this.universeCategoriesApi = new UniverseCategoriesApi(client);
        this.universeCategoryByIdApi = new UniverseCategoryByIdApi(client);
        this.universeItemGroupByIdApi = new UniverseItemGroupByIdApi(client);
        this.universeItemGroupsApi = new UniverseItemGroupsApi(client);
        this.universeMoonByIdApi = new UniverseMoonByIdApi(client);
        this.universePlanetByIdApi = new UniversePlanetByIdApi(client);
        this.universeRacesApi = new UniverseRacesApi(client);
        this.universeRegionByIdApi = new UniverseRegionByIdApi(client);
        this.universeStarByIdApi = new UniverseStarByIdApi(client);
        this.universeStargateByIdApi = new UniverseStargateByIdApi(client);
        this.universeStationByIdApi = new UniverseStationByIdApi(client);
        this.universeStructureByIdApi = new UniverseStructureByIdApi(client);
        this.universeStructuresApi = new UniverseStructuresApi(client);
        this.universeSystemByIdApi = new UniverseSystemByIdApi(client);
        this.universeSystemJumpsApi = new UniverseSystemJumpsApi(client);
        this.universeSystemKillsApi = new UniverseSystemKillsApi(client);
        this.universeSystemsApi = new UniverseSystemsApi(client);
        this.universeTypeByIdApi = new UniverseTypeByIdApi(client);
        this.universeTypesApi = new UniverseTypesApi(client);
        this.postBulkNamesToIdsApi = new PostBulkNamesToIdsApi(client);
        this.postNamesAndCategoriesApi = new PostNamesAndCategoriesApi(client);
    }

   
        async getAncestries(): Promise<any> {
            return await this.universeAncestriesApi.getAncestries();
        }
    
        async getAsteroidBeltInfo(asteroidBeltId: number): Promise<any> {
            return await this.universeAsteroidBeltApi.getAsteroidBeltInfo(asteroidBeltId);
        }
    
        async getBloodlines(): Promise<any> {
            return await this.universeBloodlinesApi.getBloodlines();
        }
    
        async getConstellationById(constellationId: number): Promise<any> {
            return await this.universeConstellationByIdApi.getConstellationById(constellationId);
        }
    
        async getConstellations(): Promise<any> {
            return await this.universeConstellationsApi.getConstellations();
        }
    
        async getFactions(): Promise<any> {
            return await this.universeFactionsApi.getFactions();
        }
    
        async getGraphicById(graphicId: number): Promise<any> {
            return await this.universeGraphicByIdApi.getGraphicById(graphicId);
        }
    
        async getGraphics(): Promise<any> {
            return await this.universeGraphicsApi.getGraphics();
        }
    
        async getItemCategories(): Promise<any> {
            return await this.universeCategoriesApi.getCategories();
        }
    
        async getItemCategoryById(categoryId: number): Promise<any> {
            return await this.universeCategoryByIdApi.getCategoryById(categoryId);
        }
    
        async getItemGroupById(groupId: number): Promise<any> {
            return await this.universeItemGroupByIdApi.getItemGroupById(groupId);
        }
    
        async getItemGroups(): Promise<any> {
            return await this.universeItemGroupsApi.getItemGroups();
        }
    
        async getMoonById(moonId: number): Promise<any> {
            return await this.universeMoonByIdApi.getMoonById(moonId);
        }
    
        async getPlanetById(planetId: number): Promise<any> {
            return await this.universePlanetByIdApi.getPlanetById(planetId);
        }
    
        async getRaces(): Promise<any> {
            return await this.universeRacesApi.getRaces();
        }
    
        async getRegionById(regionId: number): Promise<any> {
            return await this.universeRegionByIdApi.getRegionById(regionId);
        }
     
        async getStarById(starId: number): Promise<any> {
            return await this.universeStarByIdApi.getStarById(starId);
        }
    
        async getStargateById(stargateId: number): Promise<any> {
            return await this.universeStargateByIdApi.getStargateById(stargateId);
        }
    
        async getStationById(stationId: number): Promise<any> {
            return await this.universeStationByIdApi.getStationById(stationId);
        }
    
        async getStructureById(structureId: number): Promise<any> {
            return await this.universeStructureByIdApi.getStructureById(structureId);
        }
    
        async getStructures(): Promise<any> {
            return await this.universeStructuresApi.getStructures();
        }
    
        async getSystemById(systemId: number): Promise<any> {
            return await this.universeSystemByIdApi.getSystemById(systemId);
        }
    
        async getSystemJumps(): Promise<any> {
            return await this.universeSystemJumpsApi.getSystemJumps();
        }
    
        async getSystemKills(): Promise<any> {
            return await this.universeSystemKillsApi.getSystemKills();
        }
    
        async getSystems(): Promise<any> {
            return await this.universeSystemsApi.getSystems();
        }
    
        async getTypeById(typeId: number): Promise<any> {
            return await this.universeTypeByIdApi.getTypeById(typeId);
        }
    
        async getTypes(): Promise<any> {
            return await this.universeTypesApi.getTypes();
        }
    
        async postBulkNamesToIds(ids: number[]): Promise<any> {
            return await this.postBulkNamesToIdsApi.postBulkNamesToIds(ids);
        }
    
        async postNamesAndCategories(ids: number[]): Promise<any> {
            return await this.postNamesAndCategoriesApi.postNamesAndCategories(ids);
        }
    }
    