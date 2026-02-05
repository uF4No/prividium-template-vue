import { extractConfig } from './config-tools';
import path from 'node:path';
import { execCmd } from './exec-cmd';

export async function deployAndExtractAddress(contractsDir: string, addressPrefix: string) {
    await execCmd('forge soldeer install', contractsDir);
    await execCmd('pnpm build', contractsDir);
    const pkey = extractConfig(path.join(contractsDir, '.env'), 'PRIVATE_KEY');
    const regex = new RegExp(`${addressPrefix}: (0x[a-fA-F0-9]{40})`);
    const deployOutput = await execCmd(`pnpm run deploy --private-key=${pkey}`, contractsDir);
    const addressMatch = deployOutput.match(regex);
    if (!addressMatch || !addressMatch[1]) {
        throw new Error('Addres not found in deploy output');
    }
    return addressMatch[1];
}
