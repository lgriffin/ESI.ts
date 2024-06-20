import { Given, When, Then } from '@cucumber/cucumber';
import { factionWarfare } from '../../../../src/api/factions/getFactionWarfareStats';

let expect: Chai.ExpectStatic;
let response: any;

// Dynamically import chai within the function scope
async function initializeChai() {
  if (!expect) {
    const chai = await import('chai');
    expect = chai.expect;
  }
}

Given('I have a valid API token', async function () {
  await initializeChai();
  process.env.AUTH_TOKEN = 'valid_token';
});

When('I request the faction warfare stats', async function () {
  await initializeChai();
  response = await factionWarfare.stats.stats();
});

When('I request the faction warfare character stats for character ID {int}', async function (characterID: number) {
  await initializeChai();
  response = await factionWarfare.stats.characterStats(characterID);
});

When('I request the faction warfare corporation stats for corporation ID {int}', async function (corporationID: number) {
  await initializeChai();
  response = await factionWarfare.stats.corporationStats(corporationID);
});

Then('I should receive the faction warfare stats data', async function () {
  await initializeChai();
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});

Then('I should receive the character stats data for character ID {int}', async function (characterID: number) {
  await initializeChai();
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});

Then('I should receive the corporation stats data for corporation ID {int}', async function (corporationID: number) {
  await initializeChai();
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});
