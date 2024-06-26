import { Given, When, Then } from '@cucumber/cucumber';
import fetchMock from 'jest-fetch-mock';

let response: any;

Given('an alliance with ID {string} exists', async function (allianceId: string) {
    fetchMock.mockResponseOnce(JSON.stringify({
        px64x64: "https://images.evetech.net/Alliance/99000006_64.png",
        px128x128: "https://images.evetech.net/Alliance/99000006_128.png"
    }));
});

When('I request the icons for alliance ID {string}', async function (allianceId: string) {
    const res = await fetch(`https://esi.evetech.net/latest/alliances/${allianceId}/icons/`);
    response = await res.json();
});

Then('the response should contain icon URLs', function () {
    expect(response.px64x64).toContain('http');
    expect(response.px128x128).toContain('http');
});
