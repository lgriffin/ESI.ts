declare module 'winston-loggly-bulk' {
  import { TransportStreamOptions } from 'winston-transport';

  export interface LogglyOptions extends TransportStreamOptions {
    token: string;
    subdomain: string;
    tags?: string[];
    json?: boolean;
  }

  export class Loggly extends TransportStream {
    constructor(options: LogglyOptions);
  }
}
