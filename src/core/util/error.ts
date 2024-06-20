export const buildError = (message: string, type: string = 'ERROR'): Error => {
    return new Error(`[${type}] ${message}`);
  };
  