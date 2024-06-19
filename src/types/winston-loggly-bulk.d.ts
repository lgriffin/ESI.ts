declare module 'winston-loggly-bulk' {
    import TransportStream from 'winston-transport';
  
    interface LogglyOptions {
      token: string;
      subdomain: string;
      tags?: string[];
      json?: boolean;
    }
  
    export class Loggly extends TransportStream {
      constructor(options: LogglyOptions);
    }
  }
  