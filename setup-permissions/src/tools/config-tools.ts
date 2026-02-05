import fs from 'node:fs';
import { config, set } from '@dotenvx/dotenvx';
import path from 'node:path';

// Remove logs from dotenv parsing.
config({ quiet: true, ignore: ['MISSING_ENV_FILE'] });

export function extractConfig(path: string, name: string): string {
    const configMap: Record<string, string> = {};
    config({
        path,
        processEnv: configMap
    });

    if (configMap[name] === undefined) {
        throw new Error(`Missing config ${name} for ${path}`);
    }

    return configMap[name];
}

export function setDotEnvConfig(dirPath: string, name: string, value: string): void {
    set(name, value, { path: path.join(dirPath, '.env'), encrypt: false });
}

export function assertDotEnv(baseDir: string) {
    if (!fs.existsSync(path.join(baseDir, '.env'))) {
        fs.copyFileSync(path.join(baseDir, '.env.example'), path.join(baseDir, '.env'));
    }
}
