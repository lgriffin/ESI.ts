import path from 'path';

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

const __dirname = getDirname();

export const projectConfig = path.join(__dirname, 'esi.json');
export const localConfig = path.join(__dirname, 'local.json');
export const server = 'esi.evetech.net';
export const routes = ['latest', 'v1', 'v2', 'v3'];
