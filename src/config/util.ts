import fs from 'fs';
import path from 'path';
import axios from 'axios';

export const buildError = (message: string, type: string = 'ERROR'): Error => {
  return new Error(`[${type}] ${message}`);
};

export const checkForConfig = (): boolean => {
  const configPath = path.join(__dirname, 'esi.json');
  return fs.existsSync(configPath);
};

export const log = (message: string, level: string = 'INFO'): void => {
  console.log(`[${level}] ${message}`);
};

export const getSettings = (): any => {
  const configPath = path.join(__dirname, 'esi.json');
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(config);
  }
  return null;
};

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
