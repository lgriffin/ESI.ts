import fs from 'fs';
import path from 'path';

interface Config {
    projectName: string;
    link: string;
    authToken: string;
    language: string;
}

let config: Config;

const loadConfig = () => {
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
