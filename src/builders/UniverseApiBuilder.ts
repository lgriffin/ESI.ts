import { ApiClient } from '../core/ApiClient';
import { UniverseClient } from '../clients/UniverseClient';

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
