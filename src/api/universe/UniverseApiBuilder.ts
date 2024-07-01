import { ApiClient } from '../../core/ApiClient';
import { UniverseClient } from './UniverseClient';

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

export class UniverseApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): UniverseClient {
        return new UniverseClient(
            new UniverseAncestriesApi(this.client),
            new UniverseAsteroidBeltApi(this.client),
            new UniverseBloodlinesApi(this.client),
            new UniverseConstellationByIdApi(this.client),
            new UniverseConstellationsApi(this.client),
            new UniverseFactionsApi(this.client),
            new UniverseGraphicByIdApi(this.client),
            new UniverseGraphicsApi(this.client),
            new UniverseCategoriesApi(this.client),
            new UniverseCategoryByIdApi(this.client),
            new UniverseItemGroupByIdApi(this.client),
            new UniverseItemGroupsApi(this.client),
            new UniverseMoonByIdApi(this.client),
            new UniversePlanetByIdApi(this.client),
            new UniverseRacesApi(this.client),
            new UniverseRegionByIdApi(this.client),
            new UniverseStarByIdApi(this.client),
            new UniverseStargateByIdApi(this.client),
            new UniverseStationByIdApi(this.client),
            new UniverseStructureByIdApi(this.client),
            new UniverseStructuresApi(this.client),
            new UniverseSystemByIdApi(this.client),
            new UniverseSystemJumpsApi(this.client),
            new UniverseSystemKillsApi(this.client),
            new UniverseSystemsApi(this.client),
            new UniverseTypeByIdApi(this.client),
            new UniverseTypesApi(this.client),
            new PostBulkNamesToIdsApi(this.client),
            new PostNamesAndCategoriesApi(this.client)
        );
    }
}
