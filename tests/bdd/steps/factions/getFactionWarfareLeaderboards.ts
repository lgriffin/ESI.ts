import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { factionWarfare } from '../../../../src/api/factions/getFactionWarfareLeaderboards';


let response: any;

Given('I have a valid API token', function () {
  process.env.AUTH_TOKEN = 'valid_token';
});

When('I request the faction warfare character leaderboards', async function () {
  response = await factionWarfare.leaderboards.characters();
});

When('I request the faction warfare corporation leaderboards', async function () {
  response = await factionWarfare.leaderboards.corps();
});

When('I request the faction warfare leaderboards', async function () {
  response = await factionWarfare.leaderboards.leaderboard();
});

Then('I should receive the character leaderboards data', function () {
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});

Then('I should receive the corporation leaderboards data', function () {
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});

Then('I should receive the overall leaderboards data', function () {
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});
