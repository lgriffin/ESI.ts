import fs from 'fs';
import path from 'path';

interface Config {
    projectName: string;
    link: string;
    authToken: string;
    language: string;
}

let config: Config;

// Cross-platform way to get __dirname that works in both CommonJS and ES modules
const getDirname = () => {
    if (typeof __dirname !== 'undefined') {
        // CommonJS environment
        return __dirname;
    } else {
        // ES module environment - try to get from process.cwd() and work backwards
        // This is a fallback that should work in most cases
        return process.cwd();
    }
};

const loadConfig = () => {
    const __dirname = getDirname();
    const configPath = path.join(__dirname, 'esi.json');
    
    if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(configFile);
    } else {
        throw new Error('Configuration file not found');
    }
};

const getConfig = (): Config => {
    if (!config) {
        loadConfig();
    }
    return config;
};

export { getConfig };
