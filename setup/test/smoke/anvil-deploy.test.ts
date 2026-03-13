import { spawn } from 'node:child_process';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { deployAndExtractAddress } from '../../src/tools/deploy';

const ANVIL_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function waitForRpc(url: string, retries = 60, delayMs = 500) {
  for (let i = 0; i < retries; i += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        })
      });
      if (response.status === 200) {
        return;
      }
    } catch {
      // Keep retrying until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(`Anvil did not become ready at ${url}`);
}

describe('anvil deployment smoke', () => {
  const processes: Array<ReturnType<typeof spawn>> = [];

  afterEach(() => {
    for (const process of processes.splice(0)) {
      process.kill('SIGTERM');
    }
  });

  it('deploys Counter artifact with deploy helper against local Anvil', async () => {
    const port = 8545;
    const rpcUrl = `http://127.0.0.1:${port}`;
    const anvil = spawn('anvil', ['--host', '127.0.0.1', '--port', String(port)], {
      stdio: 'pipe'
    });
    processes.push(anvil);

    await waitForRpc(rpcUrl);

    const contractsDir = path.join(import.meta.dirname, '..', '..', '..', 'contracts');
    const address = await deployAndExtractAddress(contractsDir, 'out/Counter.sol/Counter.json', {
      rpcUrl,
      privateKey: ANVIL_PRIVATE_KEY,
      chainId: 31337,
      deploymentLabel: 'anvil smoke deployment'
    });

    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  }, 240_000);
});
