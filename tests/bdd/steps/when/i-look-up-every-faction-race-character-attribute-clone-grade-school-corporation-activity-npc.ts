import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

// Every reference table the features 0013 to 0018 read whole.
When(
  /^I look up every (faction|race|character attribute|clone grade|school|corporation activity|NPC corporation division|agent type|meta group|landmark|station operation|station service|planet schematic|industry activity|certificate|epic arc)$/,
  function (noun: string) {
    const p = sdeProvider(this);
    const tables: Record<string, () => unknown[]> = {
      faction: () => p.getAllFactions(),
      race: () => p.getAllRaces(),
      'character attribute': () => p.getAllCharacterAttributes(),
      'clone grade': () => p.getAllCloneGrades(),
      school: () => p.getAllSchools(),
      'corporation activity': () => p.getAllCorporationActivities(),
      'NPC corporation division': () => p.getAllNpcCorporationDivisions(),
      'agent type': () => p.getAllAgentTypes(),
      'meta group': () => p.getAllMetaGroups(),
      landmark: () => p.getAllLandmarks(),
      'station operation': () => p.getAllStationOperations(),
      'station service': () => p.getAllStationServices(),
      'planet schematic': () => p.getAllPlanetSchematics(),
      'industry activity': () => p.getAllIndustryActivities(),
      certificate: () => p.getAllCertificates(),
      'epic arc': () => p.getAllEpicArcs(),
    };
    this.result = tables[noun]!();
  },
);
