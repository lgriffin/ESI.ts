import { ApiClient } from '../../../src/core/ApiClient';
import { BaseEsiClient } from '../../../src/clients/BaseEsiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';

import { AllianceClient } from '../../../src/clients/AllianceClient';
import { AssetsClient } from '../../../src/clients/AssetsClient';
import { CalendarClient } from '../../../src/clients/CalendarClient';
import { CharacterClient } from '../../../src/clients/CharacterClient';
import { ClonesClient } from '../../../src/clients/ClonesClient';
import { ContactsClient } from '../../../src/clients/ContactsClient';
import { ContractsClient } from '../../../src/clients/ContractsClient';
import { CorporationsClient } from '../../../src/clients/CorporationsClient';
import { FittingsClient } from '../../../src/clients/FittingsClient';
import { FleetClient } from '../../../src/clients/FleetClient';
import { IndustryClient } from '../../../src/clients/IndustryClient';
import { KillmailsClient } from '../../../src/clients/KillmailsClient';
import { LoyaltyClient } from '../../../src/clients/LoyaltyClient';
import { MailClient } from '../../../src/clients/MailClient';
import { MarketClient } from '../../../src/clients/MarketClient';
import { PiClient } from '../../../src/clients/PiClient';
import { CharacterSkillsClient } from '../../../src/clients/SkillsClient';
import { WalletClient } from '../../../src/clients/WalletClient';
import { WarsClient } from '../../../src/clients/WarsClient';

let apiClient: ApiClient;
let streamSpy: jest.SpyInstance;

function mockAsyncGenerator() {
  return (async function* () {
    yield { data: [], page: 1, totalPages: 1 };
  })();
}

beforeEach(() => {
  const rateLimiter = new RateLimiter();
  rateLimiter.setTestMode(true);
  apiClient = new ApiClient('test', 'https://esi.evetech.net', 'token');
  apiClient.setRateLimiter(rateLimiter);

  streamSpy = jest
    .spyOn(BaseEsiClient.prototype as any, 'streamEndpoint')
    .mockImplementation(() => mockAsyncGenerator());
});

afterEach(() => {
  streamSpy.mockRestore();
});

describe('AllianceClient stream methods', () => {
  let client: AllianceClient;
  beforeEach(() => {
    client = new AllianceClient(apiClient);
  });

  it('streamAlliances', () => {
    client.streamAlliances();
    expect(streamSpy).toHaveBeenCalledWith('getAlliances');
  });

  it('streamCorporations', () => {
    client.streamCorporations(99005338);
    expect(streamSpy).toHaveBeenCalledWith('getCorporations', 99005338);
  });
});

describe('AssetsClient stream methods', () => {
  let client: AssetsClient;
  beforeEach(() => {
    client = new AssetsClient(apiClient);
  });

  it('streamCharacterAssets', () => {
    client.streamCharacterAssets(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterAssets', 123);
  });

  it('streamCorporationAssets', () => {
    client.streamCorporationAssets(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationAssets', 456);
  });
});

describe('CalendarClient stream methods', () => {
  let client: CalendarClient;
  beforeEach(() => {
    client = new CalendarClient(apiClient);
  });

  it('streamCalendarEvents', () => {
    client.streamCalendarEvents(123);
    expect(streamSpy).toHaveBeenCalledWith('getCalendarEvents', 123);
  });

  it('streamEventAttendees', () => {
    client.streamEventAttendees(123, 456);
    expect(streamSpy).toHaveBeenCalledWith('getEventAttendees', 123, 456);
  });
});

describe('CharacterClient stream methods', () => {
  let client: CharacterClient;
  beforeEach(() => {
    client = new CharacterClient(apiClient);
  });

  it('streamCharacterAgentsResearch', () => {
    client.streamCharacterAgentsResearch(123);
    expect(streamSpy).toHaveBeenCalledWith('getAgentsResearch', 123);
  });

  it('streamCharacterBlueprints', () => {
    client.streamCharacterBlueprints(123);
    expect(streamSpy).toHaveBeenCalledWith('getBlueprints', 123);
  });

  it('streamCharacterCorporationHistory', () => {
    client.streamCharacterCorporationHistory(123);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationHistory', 123);
  });

  it('streamCharacterMedals', () => {
    client.streamCharacterMedals(123);
    expect(streamSpy).toHaveBeenCalledWith('getMedals', 123);
  });

  it('streamCharacterNotifications', () => {
    client.streamCharacterNotifications(123);
    expect(streamSpy).toHaveBeenCalledWith('getNotifications', 123);
  });

  it('streamCharacterNotificationsContacts', () => {
    client.streamCharacterNotificationsContacts(123);
    expect(streamSpy).toHaveBeenCalledWith('getContactNotifications', 123);
  });

  it('streamCharacterStandings', () => {
    client.streamCharacterStandings(123);
    expect(streamSpy).toHaveBeenCalledWith('getStandings', 123);
  });

  it('streamCharacterTitles', () => {
    client.streamCharacterTitles(123);
    expect(streamSpy).toHaveBeenCalledWith('getTitles', 123);
  });
});

describe('ClonesClient stream methods', () => {
  let client: ClonesClient;
  beforeEach(() => {
    client = new ClonesClient(apiClient);
  });

  it('streamImplants', () => {
    client.streamImplants(123);
    expect(streamSpy).toHaveBeenCalledWith('getImplants', 123);
  });
});

describe('ContactsClient stream methods', () => {
  let client: ContactsClient;
  beforeEach(() => {
    client = new ContactsClient(apiClient);
  });

  it('streamAllianceContacts', () => {
    client.streamAllianceContacts(99005338);
    expect(streamSpy).toHaveBeenCalledWith('getAllianceContacts', 99005338);
  });

  it('streamAllianceContactLabels', () => {
    client.streamAllianceContactLabels(99005338);
    expect(streamSpy).toHaveBeenCalledWith(
      'getAllianceContactLabels',
      99005338,
    );
  });

  it('streamCharacterContacts', () => {
    client.streamCharacterContacts(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterContacts', 123);
  });

  it('streamCharacterContactLabels', () => {
    client.streamCharacterContactLabels(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterContactLabels', 123);
  });

  it('streamCorporationContacts', () => {
    client.streamCorporationContacts(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationContacts', 456);
  });

  it('streamCorporationContactLabels', () => {
    client.streamCorporationContactLabels(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationContactLabels', 456);
  });
});

describe('ContractsClient stream methods', () => {
  let client: ContractsClient;
  beforeEach(() => {
    client = new ContractsClient(apiClient);
  });

  it('streamPublicContracts', () => {
    client.streamPublicContracts(10000002);
    expect(streamSpy).toHaveBeenCalledWith('getPublicContracts', 10000002);
  });

  it('streamCharacterContracts', () => {
    client.streamCharacterContracts(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterContracts', 123);
  });

  it('streamCorporationContracts', () => {
    client.streamCorporationContracts(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationContracts', 456);
  });
});

describe('CorporationsClient stream methods', () => {
  let client: CorporationsClient;
  beforeEach(() => {
    client = new CorporationsClient(apiClient);
  });

  it('streamCorporationAllianceHistory', () => {
    client.streamCorporationAllianceHistory(456);
    expect(streamSpy).toHaveBeenCalledWith(
      'getCorporationAllianceHistory',
      456,
    );
  });

  it('streamCorporationBlueprints', () => {
    client.streamCorporationBlueprints(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationBlueprints', 456);
  });

  it('streamCorporationAlscLogs', () => {
    client.streamCorporationAlscLogs(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationAlscLogs', 456);
  });

  it('streamCorporationFacilities', () => {
    client.streamCorporationFacilities(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationFacilities', 456);
  });

  it('streamCorporationMedals', () => {
    client.streamCorporationMedals(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationMedals', 456);
  });

  it('streamCorporationIssuedMedals', () => {
    client.streamCorporationIssuedMedals(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationIssuedMedals', 456);
  });

  it('streamCorporationMembers', () => {
    client.streamCorporationMembers(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationMembers', 456);
  });

  it('streamCorporationMemberTitles', () => {
    client.streamCorporationMemberTitles(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationMembersTitles', 456);
  });

  it('streamCorporationMemberTracking', () => {
    client.streamCorporationMemberTracking(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationMemberTracking', 456);
  });

  it('streamCorporationRoles', () => {
    client.streamCorporationRoles(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationMemberRoles', 456);
  });

  it('streamCorporationRolesHistory', () => {
    client.streamCorporationRolesHistory(456);
    expect(streamSpy).toHaveBeenCalledWith(
      'getCorporationMemberRolesHistory',
      456,
    );
  });

  it('streamCorporationShareholders', () => {
    client.streamCorporationShareholders(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationShareholders', 456);
  });

  it('streamCorporationStandings', () => {
    client.streamCorporationStandings(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationStandings', 456);
  });

  it('streamCorporationStarbases', () => {
    client.streamCorporationStarbases(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationStarbases', 456);
  });

  it('streamCorporationStructures', () => {
    client.streamCorporationStructures(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationStructures', 456);
  });

  it('streamCorporationTitles', () => {
    client.streamCorporationTitles(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationTitles', 456);
  });

  it('streamNpcCorporations', () => {
    client.streamNpcCorporations();
    expect(streamSpy).toHaveBeenCalledWith('getNpcCorporations');
  });
});

describe('FittingsClient stream methods', () => {
  let client: FittingsClient;
  beforeEach(() => {
    client = new FittingsClient(apiClient);
  });

  it('streamFittings', () => {
    client.streamFittings(123);
    expect(streamSpy).toHaveBeenCalledWith('getFittings', 123);
  });
});

describe('FleetClient stream methods', () => {
  let client: FleetClient;
  beforeEach(() => {
    client = new FleetClient(apiClient);
  });

  it('streamFleetMembers', () => {
    client.streamFleetMembers(123);
    expect(streamSpy).toHaveBeenCalledWith('getFleetMembers', 123);
  });

  it('streamFleetWings', () => {
    client.streamFleetWings(123);
    expect(streamSpy).toHaveBeenCalledWith('getFleetWings', 123);
  });
});

describe('IndustryClient stream methods', () => {
  let client: IndustryClient;
  beforeEach(() => {
    client = new IndustryClient(apiClient);
  });

  it('streamCharacterIndustryJobs', () => {
    client.streamCharacterIndustryJobs(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterIndustryJobs', 123);
  });

  it('streamCharacterMiningLedger', () => {
    client.streamCharacterMiningLedger(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterMiningLedger', 123);
  });

  it('streamCorporationIndustryJobs', () => {
    client.streamCorporationIndustryJobs(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationIndustryJobs', 456);
  });

  it('streamMoonExtractionTimers', () => {
    client.streamMoonExtractionTimers(456);
    expect(streamSpy).toHaveBeenCalledWith('getMoonExtractionTimers', 456);
  });

  it('streamCorporationMiningObservers', () => {
    client.streamCorporationMiningObservers(456);
    expect(streamSpy).toHaveBeenCalledWith(
      'getCorporationMiningObservers',
      456,
    );
  });

  it('streamCorporationMiningObserver', () => {
    client.streamCorporationMiningObserver(456, 789);
    expect(streamSpy).toHaveBeenCalledWith(
      'getCorporationMiningObserver',
      456,
      789,
    );
  });

  it('streamIndustryFacilities', () => {
    client.streamIndustryFacilities();
    expect(streamSpy).toHaveBeenCalledWith('getIndustryFacilities');
  });

  it('streamIndustrySystems', () => {
    client.streamIndustrySystems();
    expect(streamSpy).toHaveBeenCalledWith('getIndustrySystems');
  });
});

describe('KillmailsClient stream methods', () => {
  let client: KillmailsClient;
  beforeEach(() => {
    client = new KillmailsClient(apiClient);
  });

  it('streamCharacterRecentKillmails', () => {
    client.streamCharacterRecentKillmails(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterRecentKillmails', 123);
  });

  it('streamCorporationRecentKillmails', () => {
    client.streamCorporationRecentKillmails(456);
    expect(streamSpy).toHaveBeenCalledWith(
      'getCorporationRecentKillmails',
      456,
    );
  });
});

describe('LoyaltyClient stream methods', () => {
  let client: LoyaltyClient;
  beforeEach(() => {
    client = new LoyaltyClient(apiClient);
  });

  it('streamLoyaltyPoints', () => {
    client.streamLoyaltyPoints(123);
    expect(streamSpy).toHaveBeenCalledWith('getLoyaltyPoints', 123);
  });

  it('streamLoyaltyStoreOffers', () => {
    client.streamLoyaltyStoreOffers(456);
    expect(streamSpy).toHaveBeenCalledWith('getLoyaltyStoreOffers', 456);
  });
});

describe('MailClient stream methods', () => {
  let client: MailClient;
  beforeEach(() => {
    client = new MailClient(apiClient);
  });

  it('streamMailHeaders', () => {
    client.streamMailHeaders(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterMailHeaders', 123);
  });

  it('streamMailingLists', () => {
    client.streamMailingLists(123);
    expect(streamSpy).toHaveBeenCalledWith('getMailingLists', 123);
  });
});

describe('MarketClient stream methods', () => {
  let client: MarketClient;
  beforeEach(() => {
    client = new MarketClient(apiClient);
  });

  it('streamMarketTypes', () => {
    client.streamMarketTypes(10000002);
    expect(streamSpy).toHaveBeenCalledWith('getMarketTypes', 10000002);
  });

  it('streamCharacterOrderHistory', () => {
    client.streamCharacterOrderHistory(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterOrderHistory', 123);
  });

  it('streamCorporationOrders', () => {
    client.streamCorporationOrders(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationOrders', 456);
  });

  it('streamCorporationOrderHistory', () => {
    client.streamCorporationOrderHistory(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationOrderHistory', 456);
  });
});

describe('PiClient stream methods', () => {
  let client: PiClient;
  beforeEach(() => {
    client = new PiClient(apiClient);
  });

  it('streamColonies', () => {
    client.streamColonies(123);
    expect(streamSpy).toHaveBeenCalledWith('getColonies', 123);
  });

  it('streamCorporationCustomsOffices', () => {
    client.streamCorporationCustomsOffices(456);
    expect(streamSpy).toHaveBeenCalledWith('getCorporationCustomsOffices', 456);
  });
});

describe('CharacterSkillsClient stream methods', () => {
  let client: CharacterSkillsClient;
  beforeEach(() => {
    client = new CharacterSkillsClient(apiClient);
  });

  it('streamCharacterSkillQueue', () => {
    client.streamCharacterSkillQueue(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterSkillQueue', 123);
  });
});

describe('WalletClient stream methods', () => {
  let client: WalletClient;
  beforeEach(() => {
    client = new WalletClient(apiClient);
  });

  it('streamCharacterWalletJournal', () => {
    client.streamCharacterWalletJournal(123);
    expect(streamSpy).toHaveBeenCalledWith('getCharacterWalletJournal', 123);
  });

  it('streamCorporationWalletJournal', () => {
    client.streamCorporationWalletJournal(456, 1);
    expect(streamSpy).toHaveBeenCalledWith(
      'getCorporationWalletJournal',
      456,
      1,
    );
  });

  it('streamCharacterWalletTransactions', () => {
    client.streamCharacterWalletTransactions(123);
    expect(streamSpy).toHaveBeenCalledWith(
      'getCharacterWalletTransactions',
      123,
    );
  });

  it('streamCorporationWalletTransactions', () => {
    client.streamCorporationWalletTransactions(456, 1);
    expect(streamSpy).toHaveBeenCalledWith(
      'getCorporationWalletTransactions',
      456,
      1,
    );
  });
});

describe('WarsClient stream methods', () => {
  let client: WarsClient;
  beforeEach(() => {
    client = new WarsClient(apiClient);
  });

  it('streamWars', () => {
    client.streamWars();
    expect(streamSpy).toHaveBeenCalledWith('getWars');
  });

  it('streamWarKillmails', () => {
    client.streamWarKillmails(123);
    expect(streamSpy).toHaveBeenCalledWith('getWarKillmails', 123);
  });
});
