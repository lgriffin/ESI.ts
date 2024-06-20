import axios from 'axios';

export const request = async ({ subUrl, needsAuth = false }: { subUrl: string; needsAuth?: boolean }): Promise<object> => {
  const baseUrl = 'https://esi.evetech.net/latest/';
  const url = `${baseUrl}${subUrl}`;
  const headers = needsAuth ? { Authorization: `Bearer ${process.env.AUTH_TOKEN}` } : {};
  const response = await axios.get(url, { headers });
  return response.data;
};

export const inputValidation = ({ input, type, message }: { input: any; type: string; message: string }): void => {
  if (typeof input !== type) {
    throw new Error(message);
  }
};
