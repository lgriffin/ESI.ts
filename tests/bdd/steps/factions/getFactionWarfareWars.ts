import { Given, When, Then } from '@cucumber/cucumber';
import { factionWarfare } from '../../../../src/api/factions/getFactionWarfareSystems';

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

When('I request the faction warfare systems', async function () {
  await initializeChai();
  response = await factionWarfare.systems();
});

Then('I should receive the faction warfare systems data', async function () {
  await initializeChai();
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});
