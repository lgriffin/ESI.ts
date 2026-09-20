export interface ServerStatus {
  players: number;
  server_version: string;
  start_time: string;
  vip: boolean;
}

export interface EsiClientConfig {
  clientId?: string;
}

export declare class EsiClient {
  constructor(config?: EsiClientConfig);
  readonly status: { getStatus(): Promise<ServerStatus> };
  shutdown(): Promise<void>;
}
