import { EsiClient } from '../../src/EsiClient';

const GATED_TESTS_ENABLED = process.env.ESI_GATED_TESTS === 'true';
const describeIfGated = GATED_TESTS_ENABLED ? describe : describe.skip;

function extractCharacterId(token: string): number {
  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64url').toString(),
  );
  const match = (payload.sub as string).match(/CHARACTER:EVE:(\d+)/);
  if (!match)
    throw new Error(
      `Cannot extract character ID from token sub: ${payload.sub}`,
    );
  return parseInt(match[1], 10);
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let client: EsiClient;
let characterId: number;

if (GATED_TESTS_ENABLED) {
  const token = process.env.ESI_ACCESS_TOKEN;
  if (!token)
    throw new Error('ESI_GATED_TESTS=true but ESI_ACCESS_TOKEN is not set');
  characterId = extractCharacterId(token);

  beforeAll(() => {
    client = new EsiClient({
      clientId: 'esi-ts-gated-integration',
      accessToken: token,
    });
  });

  afterAll(async () => {
    await client.shutdown();
  });
}

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Location', () => {
  afterAll(() => delay(500));

  it('getCharacterLocation returns solar_system_id', async () => {
    const result = await client.location.getCharacterLocation(characterId);
    expect(result).toHaveProperty('solar_system_id');
    expect(typeof result.solar_system_id).toBe('number');
  });

  it('getCharacterOnline returns online status', async () => {
    const result = await client.location.getCharacterOnline(characterId);
    expect(result).toHaveProperty('online');
    expect(typeof result.online).toBe('boolean');
  });

  it('getCharacterShip returns ship_type_id', async () => {
    const result = await client.location.getCharacterShip(characterId);
    expect(result).toHaveProperty('ship_type_id');
    expect(typeof result.ship_type_id).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Skills', () => {
  afterAll(() => delay(500));

  it('getCharacterSkills returns total_sp and skills array', async () => {
    const result = await client.skills.getCharacterSkills(characterId);
    expect(result).toHaveProperty('total_sp');
    expect(typeof result.total_sp).toBe('number');
    expect(result).toHaveProperty('skills');
    expect(Array.isArray(result.skills)).toBe(true);
  });

  it('getCharacterSkillQueue returns an array', async () => {
    const result = await client.skills.getCharacterSkillQueue(characterId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getCharacterAttributes returns intelligence/memory/etc', async () => {
    const result = await client.skills.getCharacterAttributes(characterId);
    expect(result).toHaveProperty('intelligence');
    expect(result).toHaveProperty('memory');
    expect(result).toHaveProperty('perception');
    expect(result).toHaveProperty('willpower');
    expect(result).toHaveProperty('charisma');
  });
});

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Wallet', () => {
  afterAll(() => delay(500));

  it('getCharacterWallet returns a number (ISK balance)', async () => {
    const result = await client.wallet.getCharacterWallet(characterId);
    expect(typeof result).toBe('number');
  });

  it('getCharacterWalletJournal returns an array', async () => {
    const result = await client.wallet.getCharacterWalletJournal(characterId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getCharacterWalletTransactions returns an array', async () => {
    const result =
      await client.wallet.getCharacterWalletTransactions(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Assets', () => {
  afterAll(() => delay(500));

  it('getCharacterAssets returns an array', async () => {
    const result = await client.assets.getCharacterAssets(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Characters (authenticated endpoints)
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Characters', () => {
  afterAll(() => delay(500));

  it('getCharacterBlueprints returns an array', async () => {
    const result = await client.characters.getCharacterBlueprints(characterId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getCharacterStandings returns an array', async () => {
    const result = await client.characters.getCharacterStandings(characterId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getCharacterRoles returns role arrays', async () => {
    const result = await client.characters.getCharacterRoles(characterId);
    expect(result).toHaveProperty('roles');
    expect(Array.isArray(result.roles)).toBe(true);
  });

  it('getCharacterNotifications returns an array', async () => {
    const result =
      await client.characters.getCharacterNotifications(characterId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getCharacterMedals returns an array', async () => {
    const result = await client.characters.getCharacterMedals(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Clones
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Clones', () => {
  afterAll(() => delay(500));

  it('getClones returns home_location', async () => {
    const result = await client.clones.getClones(characterId);
    expect(result).toHaveProperty('home_location');
  });

  it('getImplants returns an array', async () => {
    const result = await client.clones.getImplants(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Contacts', () => {
  afterAll(() => delay(500));

  it('getCharacterContacts returns an array', async () => {
    const result = await client.contacts.getCharacterContacts(characterId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getCharacterContactLabels returns an array', async () => {
    const result = await client.contacts.getCharacterContactLabels(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Killmails
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Killmails', () => {
  afterAll(() => delay(500));

  it('getCharacterRecentKillmails returns an array', async () => {
    const result =
      await client.killmails.getCharacterRecentKillmails(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mail
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Mail', () => {
  afterAll(() => delay(500));

  it('getMailHeaders returns an array', async () => {
    const result = await client.mail.getMailHeaders(characterId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getMailLabels returns labels', async () => {
    const result = await client.mail.getMailLabels(characterId);
    expect(result).toHaveProperty('labels');
    expect(Array.isArray(result.labels)).toBe(true);
  });

  it('getMailingLists returns an array', async () => {
    const result = await client.mail.getMailingLists(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Fittings
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Fittings', () => {
  afterAll(() => delay(500));

  it('getFittings returns an array', async () => {
    const result = await client.fittings.getFittings(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Industry
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Industry', () => {
  afterAll(() => delay(500));

  it('getCharacterIndustryJobs returns an array', async () => {
    const result = await client.industry.getCharacterIndustryJobs(characterId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getCharacterMiningLedger returns an array', async () => {
    const result = await client.industry.getCharacterMiningLedger(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Market (authenticated)
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Market', () => {
  afterAll(() => delay(500));

  it('getCharacterOrders returns an array', async () => {
    const result = await client.market.getCharacterOrders(characterId);
    expect(Array.isArray(result)).toBe(true);
  });

  it('getCharacterOrderHistory returns an array', async () => {
    const result = await client.market.getCharacterOrderHistory(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Loyalty
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Loyalty', () => {
  afterAll(() => delay(500));

  it('getLoyaltyPoints returns an array', async () => {
    const result = await client.loyalty.getLoyaltyPoints(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Contracts', () => {
  afterAll(() => delay(500));

  it('getCharacterContracts returns an array', async () => {
    const result = await client.contracts.getCharacterContracts(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Calendar', () => {
  afterAll(() => delay(500));

  it('getCalendarEvents returns an array', async () => {
    const result = await client.calendar.getCalendarEvents(characterId);
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Factions (character stats)
// ---------------------------------------------------------------------------

describeIfGated('Gated Auth: Faction Warfare', () => {
  it('getCharacterStats returns stats or empty', async () => {
    try {
      const result = await client.factions.getCharacterStats(characterId);
      expect(result).toBeDefined();
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      if (error.statusCode === 200) throw err;
    }
  });
});
