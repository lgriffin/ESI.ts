import { Given, When, Then } from '@cucumber/cucumber';
import { FactionWarfareSystemsApi } from '../../../../src/api/factions/getFactionWarfareSystems';
import { ApiClientBuilder } from '../../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../../src/config/configManager';

let api: FactionWarfareSystemsApi;
let response: any;
let expect: Chai.ExpectStatic;

async function initializeChai() {
    if (!expect) {
        const chai = await import('chai');
        expect = chai.expect;
    }
}

Given('I have a valid API token', async function () {
    await initializeChai();
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setAccessToken(config.authToken)
        .setLink(config.link)
        .build();
    api = new FactionWarfareSystemsApi(client);
});

When('I request the faction warfare systems', async function () {
    response = await api.getSystems();
});

Then('I should receive the faction warfare systems data', async function () {
    expect(response).to.be.an('object');
    // Add more specific assertions as needed
});
