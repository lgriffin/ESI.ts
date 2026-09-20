# Authenticated Endpoint Examples

These examples require an EVE SSO access token. Set it via environment variable:

```bash
export ESI_ACCESS_TOKEN=your-eve-sso-token
```

Or pass it to the client:

```typescript
const client = new EsiClient({ accessToken: 'your-token' });
```

## Wallet

```typescript
const client = new EsiClient();

const balance = await client.wallet.getCharacterWallet(characterId);
console.log(`Balance: ${balance.toLocaleString()} ISK`);

const journal = await client.wallet.getCharacterWalletJournal(characterId);
for (const entry of journal.slice(0, 5)) {
  console.log(`${entry.date}: ${entry.ref_type} — ${entry.amount} ISK`);
}

const txns = await client.wallet.getCharacterWalletTransactions(characterId);
for (const tx of txns.slice(0, 5)) {
  console.log(
    `${tx.date}: ${tx.quantity}x type ${tx.type_id} @ ${tx.unit_price} ISK`,
  );
}
```

## Skills

```typescript
const client = new EsiClient();

const skills = await client.skills.getCharacterSkills(characterId);
console.log(`Total SP: ${skills.total_sp.toLocaleString()}`);
console.log(`Unallocated SP: ${skills.unallocated_sp?.toLocaleString()}`);
console.log(`${skills.skills.length} skills trained`);

const queue = await client.skills.getCharacterSkillQueue(characterId);
for (const entry of queue) {
  console.log(
    `Training: skill ${entry.skill_id} to level ${entry.finished_level}`,
  );
}
```

## Assets

```typescript
const client = new EsiClient();

const assets = await client.assets.getCharacterAssets(characterId);
console.log(`${assets.length} asset entries`);

// Group by location
const byLocation = new Map<number, typeof assets>();
for (const item of assets) {
  const loc = byLocation.get(item.location_id) ?? [];
  loc.push(item);
  byLocation.set(item.location_id, loc);
}

for (const [locId, items] of byLocation) {
  console.log(`Location ${locId}: ${items.length} items`);
}
```

## Character Location

```typescript
const client = new EsiClient();

const location = await client.location.getCharacterLocation(characterId);
console.log(`System: ${location.solar_system_id}`);
if (location.station_id) console.log(`Docked at: ${location.station_id}`);

const ship = await client.location.getCharacterShip(characterId);
console.log(`Flying: type ${ship.ship_type_id} "${ship.ship_name}"`);

const online = await client.location.getCharacterOnline(characterId);
console.log(`Online: ${online.online}`);
```

## Mail

```typescript
const client = new EsiClient();

// Read mail
const mail = await client.mail.getCharacterMail(characterId);
for (const msg of mail.slice(0, 5)) {
  console.log(`From ${msg.from}: ${msg.subject}`);
}

// Send mail
await client.mail.sendMail(characterId, {
  recipients: [{ recipient_id: targetId, recipient_type: 'character' }],
  subject: 'Hello from ESI.ts',
  body: 'This mail was sent via the API!',
});
```

## Contacts

```typescript
const client = new EsiClient();

// Read contacts
const contacts = await client.contacts.getCharacterContacts(characterId);
for (const c of contacts) {
  console.log(`Contact ${c.contact_id}: standing ${c.standing}`);
}

// Add a contact
await client.contacts.postCharacterContacts(characterId, 10, [targetId]);

// Remove a contact
await client.contacts.deleteCharacterContacts(characterId, [targetId]);
```

## Industry

```typescript
const client = new EsiClient();

const jobs = await client.industry.getCharacterIndustryJobs(characterId);
for (const job of jobs) {
  console.log(`Job ${job.job_id}: ${job.activity_id} — ${job.status}`);
}
```

## Fittings

```typescript
const client = new EsiClient();

const fittings = await client.fittings.getFittings(characterId);
for (const fit of fittings) {
  console.log(`${fit.name}: ${fit.ship_type_id} (${fit.items.length} modules)`);
}

// Save a new fitting
const result = await client.fittings.createFitting(characterId, {
  name: 'PvP Harbinger',
  ship_type_id: 24690,
  description: 'Armor HAM fit',
  items: [{ type_id: 3170, flag: 11, quantity: 1 }],
});
```

## Fleet Operations

```typescript
const client = new EsiClient();

// Requires being fleet boss
const fleet = await client.fleets.getFleetInformation(fleetId);
console.log(`Fleet MOTD: ${fleet.motd}`);

const members = await client.fleets.getFleetMembers(fleetId);
console.log(`${members.length} members in fleet`);
```
