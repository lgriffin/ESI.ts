import fs from 'fs';
import path from 'path';
import { buildError } from './error';

// Cross-platform way to get __dirname that works in both CommonJS and ES modules
const getDirname = () => {
  if (typeof __dirname !== 'undefined') {
    // CommonJS environment
    return __dirname;
  } else {
    // ES module environment - try to get from process.cwd() and work backwards
    return process.cwd();
  }
};

export const checkForConfig = (): boolean => {
  const __dirname = getDirname();
  const configPath = path.join(__dirname, '../../config/esi.json');
  return fs.existsSync(configPath);
};

export const getSettings = (): any => {
  const __dirname = getDirname();
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
