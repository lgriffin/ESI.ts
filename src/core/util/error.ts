export const buildError = (message: string, type: string = 'ERROR', url?: string): Error => {
  const error = new Error(`[${type}] ${message}`);
  if (url) {
      (error as any).url = url;
  }
  return error;
};
