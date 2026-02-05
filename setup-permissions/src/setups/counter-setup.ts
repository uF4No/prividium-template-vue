import type { Client } from '../tools/create-admin-client';
import { extractRes, postApplications, postContractPermissions, postContracts } from '../tools/api-client';
import path from 'node:path';
import fs from 'node:fs';
import type { Abi } from 'abitype';
import { formatAbiItem } from 'abitype';
import { toFunctionSelector } from 'viem';
import { deployAndExtractAddress } from '../tools/deploy';
import { assertDotEnv, setDotEnvConfig } from '../tools/config-tools';
import { z } from 'zod/v4';

const OutJsonSchema = z.object({
    abi: z.unknown()
});

export async function setupCounterDapp(adminApiClient: Client) {
    const webAppDir = path.join(import.meta.dirname, '..', '..', '..', 'web-app');
    const contractsDir = path.join(import.meta.dirname, '..', '..', '..', 'contracts');

    assertDotEnv(webAppDir);
    assertDotEnv(contractsDir);

    // Create OAuth application
    const app = extractRes(
        await postApplications(adminApiClient, {
            name: 'Counter Demo App',
            origin: 'http://localhost:3000',
            oauthRedirectUris: ['http://localhost:3000/auth-callback']
        })
    );
    setDotEnvConfig(webAppDir, 'VITE_CLIENT_ID', app.oauthClientId);

    // Deploy contract
    const contractAddress = await deployAndExtractAddress(contractsDir, 'Counter contract deployed to');
    setDotEnvConfig(webAppDir, 'VITE_COUNTER_CONTRACT_ADDRESS', contractAddress);

    // Read contract ABI
    const jsonStr = fs.readFileSync(path.join(contractsDir, 'out', 'Counter.sol', 'Counter.json')).toString();
    const rawJson = z.unknown().parse(JSON.parse(jsonStr));
    const rawAbi = OutJsonSchema.parse(rawJson).abi;
    const counterAbi = rawAbi as Abi;

    // Register contract with Prividium API
    const counterContract = extractRes(
        await postContracts(adminApiClient, {
            abi: JSON.stringify(counterAbi),
            name: 'Counter',
            contractAddress: contractAddress,
            description: 'Simple counter contract for demo app',
            discloseBytecode: false,
            discloseErc20Balance: false,
            erc20LockAddresses: []
        })
    );

    // Configure permissions for all contract functions
    for (const abiItem of counterAbi) {
        if (abiItem.type !== 'function') {
            continue;
        }

        extractRes(
            await postContractPermissions(adminApiClient, {
                contractAddress: counterContract.contractAddress,
                accessType: abiItem.stateMutability === 'view' || abiItem.stateMutability === 'pure' ? 'read' : 'write',
                argumentRestrictions: [],
                roles: [],
                functionSignature: formatAbiItem(abiItem),
                methodSelector: toFunctionSelector(abiItem),
                ruleType: 'public'
            })
        );
    }
}
