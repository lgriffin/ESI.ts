export class EsiClient {
  constructor(config = {}) {
    this.clientId = config.clientId ?? 'esi-client';
    this.status = {
      getStatus: async () => {
        const response = await fetch('https://esi.evetech.net/status/');
        return response.json();
      },
    };
  }

  async shutdown() {}
}
