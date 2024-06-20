import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { factionWarfare } from '../../../../src/api/factions/getFactionWarfareStats';

let response: any;
let characterID: number;
let corporationID: number;

Given('I have a valid API token', function () {
  process.env.AUTH_TOKEN = 'valid_token';
});

Given('a valid character ID of {int}', function (id: number) {
  characterID = id;
});

Given('a valid corporation ID of {int}', function (id: number) {
  corporationID = id;
});

When('I request the faction warfare stats', async function () {
  response = await factionWarfare.stats.stats();
});

When('I request the faction warfare stats for the character', async function () {
  response = await factionWarfare.stats.characterStats(characterID);
});

When('I request the faction warfare stats for the corporation', async function () {
  response = await factionWarfare.stats.corporationStats(corporationID);
});

Then('I should receive the faction warfare stats data', function () {
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});

Then('I should receive the faction warfare stats data for the character', function () {
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});

Then('I should receive the faction warfare stats data for the corporation', function () {
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});
