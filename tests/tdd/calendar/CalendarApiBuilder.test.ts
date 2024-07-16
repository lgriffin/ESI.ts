import { CalendarApiBuilder } from '../../../src/builders/CalendarApiBuilder';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import { CalendarClient } from '../../../src/clients/CalendarClient';

const config = getConfig();

describe('CalendarApiBuilder', () => {
    let client: any;

    beforeAll(() => {
        client = new ApiClientBuilder()
            .setClientId(config.projectName)
            .setLink(config.link)
            .setAccessToken(config.authToken || undefined)
            .build();
    });

    it('should build a CalendarClient instance', () => {
        const builder = new CalendarApiBuilder(client);
        const calendarClient = builder.build();
        expect(calendarClient).toBeInstanceOf(CalendarClient);
    });
});
