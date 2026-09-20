/* eslint-disable @typescript-eslint/no-explicit-any */
export const getBody = async (apiCall: () => Promise<any>): Promise<any> => {
  return apiCall();
};
/* eslint-enable @typescript-eslint/no-explicit-any */
