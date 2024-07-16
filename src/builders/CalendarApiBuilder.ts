import { ApiClient } from '../core/ApiClient';
import { CalendarClient } from '../clients/CalendarClient';

export class CalendarApiBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): CalendarClient {
        return new CalendarClient(this.client);
    }
}
