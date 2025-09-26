import { ApiClient } from '../core/ApiClient';
import { CalendarClient } from '../clients/CalendarClient';
import { IAPIBuilder } from '../core/IAPIBuilder';

export class CalendarApiBuilder implements IAPIBuilder {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    public build(): CalendarClient {
        return new CalendarClient(this.client);
    }
}
