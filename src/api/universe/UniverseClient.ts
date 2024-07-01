import { UniverseAncestriesApi } from './getAncestries';
import { UniverseAsteroidBeltApi } from './getAsteroidBeltInfo';
import { UniverseBloodlinesApi } from './getBloodlines';
import { UniverseConstellationByIdApi } from './getConstellationById';
import { UniverseConstellationsApi } from './getConstellations';
import { UniverseFactionsApi } from './getFactions';
import { UniverseGraphicByIdApi } from './getGraphicById';
import { UniverseGraphicsApi } from './getGraphics';
import { UniverseCategoriesApi } from './getItemCategories';
import { UniverseCategoryByIdApi } from './getItemCategoryById';
import { UniverseItemGroupByIdApi } from './getItemGroupById';
import { UniverseItemGroupsApi } from './getItemGroups';
import { UniverseMoonByIdApi } from './getMoonById';
import { UniversePlanetByIdApi } from './getPlanetById';
import { UniverseRacesApi } from './getRaces';
import { UniverseRegionByIdApi } from './getRegionById';
import { UniverseStarByIdApi } from './getStarById';
import { UniverseStargateByIdApi } from './getStargateById';
import { UniverseStationByIdApi } from './getStationById';
import { UniverseStructureByIdApi } from './getStructureById';
import { UniverseStructuresApi } from './getStructures';
import { UniverseSystemByIdApi } from './getSystemById';
import { UniverseSystemJumpsApi } from './getSystemJumps';
import { UniverseSystemKillsApi } from './getSystemKills';
import { UniverseSystemsApi } from './getSystems';
import { UniverseTypeByIdApi } from './getTypeById';
import { UniverseTypesApi } from './getTypes';
import { PostBulkNamesToIdsApi } from './postBulkNamesToIds';
import { PostNamesAndCategoriesApi } from './postNamesAndCategories';

export class UniverseClient {
    constructor(
        private getAncestriesApi: UniverseAncestriesApi,
        private getAsteroidBeltInfoApi: UniverseAsteroidBeltApi,
        private getBloodlinesApi: UniverseBloodlinesApi,
        private getConstellationByIdApi: UniverseConstellationByIdApi,
        private getConstellationsApi: UniverseConstellationsApi,
        private getFactionsApi: UniverseFactionsApi,
        private getGraphicByIdApi: UniverseGraphicByIdApi,
        private getGraphicsApi: UniverseGraphicsApi,
        private getItemCategoriesApi: UniverseCategoriesApi,
        private getItemCategoryByIdApi: UniverseCategoryByIdApi,
        private getItemGroupByIdApi: UniverseItemGroupByIdApi,
        private getItemGroupsApi: UniverseItemGroupsApi,
        private getMoonByIdApi: UniverseMoonByIdApi,
        private getPlanetByIdApi: UniversePlanetByIdApi,
        private getRacesApi: UniverseRacesApi,
        private getRegionByIdApi: UniverseRegionByIdApi,
        private getStarByIdApi: UniverseStarByIdApi,
        private getStargateByIdApi: UniverseStargateByIdApi,
        private getStationByIdApi: UniverseStationByIdApi,
        private getStructureByIdApi: UniverseStructureByIdApi,
        private getStructuresApi: UniverseStructuresApi,
        private getSystemByIdApi: UniverseSystemByIdApi,
        private getSystemJumpsApi: UniverseSystemJumpsApi,
        private getSystemKillsApi: UniverseSystemKillsApi,
        private getSystemsApi: UniverseSystemsApi,
        private getTypeByIdApi: UniverseTypeByIdApi,
        private getTypesApi: UniverseTypesApi,
        private postBulkNamesToIdsApi: PostBulkNamesToIdsApi,
        private postNamesAndCategoriesApi: PostNamesAndCategoriesApi
    ) {}

    async getAncestries() {
        return this.getAncestriesApi.getAncestries();
    }

    async getAsteroidBeltInfo(asteroidBeltId: number) {
        return this.getAsteroidBeltInfoApi.getAsteroidBeltInfo(asteroidBeltId);
    }

    async getBloodlines() {
        return this.getBloodlinesApi.getBloodlines();
    }

    async getConstellationById(constellationId: number) {
        return this.getConstellationByIdApi.getConstellationById(constellationId);
    }

    async getConstellations() {
        return this.getConstellationsApi.getConstellations();
    }

    async getFactions() {
        return this.getFactionsApi.getFactions();
    }

    async getGraphicById(graphicId: number) {
        return this.getGraphicByIdApi.getGraphicById(graphicId);
    }

    async getGraphics() {
        return this.getGraphicsApi.getGraphics();
    }

    async getItemCategories() {
        return this.getItemCategoriesApi.getCategories();
    }

    async getItemCategoryById(categoryId: number) {
        return this.getItemCategoryByIdApi.getCategoryById(categoryId);
    }

    async getItemGroupById(groupId: number) {
        return this.getItemGroupByIdApi.getItemGroupById(groupId);
    }

    async getItemGroups() {
        return this.getItemGroupsApi.getItemGroups();
    }

    async getMoonById(moonId: number) {
        return this.getMoonByIdApi.getMoonById(moonId);
    }

    async getPlanetById(planetId: number) {
        return this.getPlanetByIdApi.getPlanetById(planetId);
    }

    async getRaces() {
        return this.getRacesApi.getRaces();
    }

    async getRegionById(regionId: number) {
        return this.getRegionByIdApi.getRegionById(regionId);
    }

    async getStarById(starId: number) {
        return this.getStarByIdApi.getStarById(starId);
    }

    async getStargateById(stargateId: number) {
        return this.getStargateByIdApi.getStargateById(stargateId);
    }

    async getStationById(stationId: number) {
        return this.getStationByIdApi.getStationById(stationId);
    }

    async getStructureById(structureId: number) {
        return this.getStructureByIdApi.getStructureById(structureId);
    }

    async getStructures() {
        return this.getStructuresApi.getStructures();
    }

    async getSystemById(systemId: number) {
        return this.getSystemByIdApi.getSystemById(systemId);
    }

    async getSystemJumps() {
        return this.getSystemJumpsApi.getSystemJumps();
    }

    async getSystemKills() {
        return this.getSystemKillsApi.getSystemKills();
    }

    async getSystems() {
        return this.getSystemsApi.getSystems();
    }

    async getTypeById(typeId: number) {
        return this.getTypeByIdApi.getTypeById(typeId);
    }

    async getTypes() {
        return this.getTypesApi.getTypes();
    }

    async postBulkNamesToIds(ids: number[]) {
        return this.postBulkNamesToIdsApi.postBulkNamesToIds(ids);
    }

    async postNamesAndCategories(ids: number[]) {
        return this.postNamesAndCategoriesApi.postNamesAndCategories(ids);
    }
}
