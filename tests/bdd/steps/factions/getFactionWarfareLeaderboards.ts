import { Given, When, Then } from '@cucumber/cucumber';
import { factionWarfare } from '../../../../src/api/factions/getFactionWarfareLeaderboards';

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

When('I request the faction warfare character leaderboards', async function () {
  await initializeChai();
  response = await factionWarfare.leaderboards.characters();
});

When('I request the faction warfare corporation leaderboards', async function () {
  await initializeChai();
  response = await factionWarfare.leaderboards.corps();
});

When('I request the faction warfare leaderboards', async function () {
  await initializeChai();
  response = await factionWarfare.leaderboards.leaderboard();
});

Then('I should receive the character leaderboards data', async function () {
  await initializeChai();
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});

Then('I should receive the corporation leaderboards data', async function () {
  await initializeChai();
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});

Then('I should receive the overall leaderboards data', async function () {
  await initializeChai();
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});
