import fs from 'fs';
import path from 'path';
import { buildError } from './error';

export const checkForConfig = (): boolean => {
  const configPath = path.join(__dirname, '../../config/esi.json');
  return fs.existsSync(configPath);
};

export const getSettings = (): any => {
  const configPath = path.join(__dirname, '../../config/esi.json');
  if (fs.existsSync(configPath)) {
    const config = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(config);
  }
  return null;
};

export const log = (message: string, level: string = 'INFO'): void => {
  console.log(`[${level}] ${message}`);
};
