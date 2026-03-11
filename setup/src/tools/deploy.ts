import fs from 'node:fs';
import path from 'node:path';
import {
  http,
  type Abi,
  type Address,
  type Hex,
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeDeployData,
  formatEther
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { execCmd } from './exec-cmd';

type DeployOptions = {
  rpcUrl: string;
  privateKey: string;
  chainId: number;
  authToken?: string;
  deploymentLabel?: string;
};

type DeployedContracts = Record<string, Address>;

const DEPLOYMENT_BALANCE_BUFFER_NUMERATOR = 12n;
const DEPLOYMENT_BALANCE_BUFFER_DENOMINATOR = 10n;

export async function deployAndExtractAddress(
  contractsDir: string,
  artifactPath: string,
  options: DeployOptions
): Promise<Address>;
export async function deployAndExtractAddress(
  contractsDir: string,
  artifactPaths: string[],
  options: DeployOptions
): Promise<DeployedContracts>;
export async function deployAndExtractAddress(
  contractsDir: string,
  artifactPathOrPaths: string | string[],
  options: DeployOptions
): Promise<Address | DeployedContracts> {
  try {
    await execCmd('forge soldeer install', contractsDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('soldeer') || message.includes('not connected')) {
      console.warn('⚠️  forge soldeer install failed (continuing with existing dependencies).');
    } else {
      throw error;
    }
  }
  await execCmd('pnpm build', contractsDir);

  const artifactPaths = Array.isArray(artifactPathOrPaths)
    ? artifactPathOrPaths
    : [artifactPathOrPaths];

  const account = privateKeyToAccount(options.privateKey as `0x${string}`);
  const chain = defineChain({
    id: options.chainId,
    name: 'Prividium L2',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [options.rpcUrl] },
      public: { http: [options.rpcUrl] }
    }
  });

  const transport = options.authToken
    ? http(options.rpcUrl, {
        fetchFn: async (url, init) => {
          const headers = new Headers(init?.headers);
          headers.set('Authorization', `Bearer ${options.authToken}`);
          return fetch(url, { ...init, headers });
        }
      })
    : http(options.rpcUrl);

  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ chain, transport, account });
  const deploymentLabel = options.deploymentLabel ?? 'contract deployment';

  const artifacts = artifactPaths.map((artifactPath) => {
    const artifactJson = JSON.parse(
      fs.readFileSync(path.join(contractsDir, artifactPath)).toString()
    ) as { abi: unknown; bytecode?: { object?: string } };
    const bytecode = artifactJson.bytecode?.object as Hex | undefined;
    if (!bytecode) {
      throw new Error(`Missing bytecode in artifact: ${artifactPath}`);
    }

    return {
      artifactPath,
      abi: artifactJson.abi as Abi,
      bytecode
    };
  });

  console.log(`🔎 Checking deployer balance for ${deploymentLabel}...`);
  const gasPrice = await publicClient.getGasPrice();
  const balance = await publicClient.getBalance({ address: account.address });
  const gasEstimates = await Promise.all(
    artifacts.map(async ({ artifactPath, abi, bytecode }) => {
      const gas = await publicClient.estimateGas({
        account: account.address,
        data: encodeDeployData({
          abi,
          bytecode
        })
      });

      return {
        artifactPath,
        gas
      };
    })
  );
  const requiredWei =
    (gasEstimates.reduce((sum, estimate) => sum + estimate.gas, 0n) *
      gasPrice *
      DEPLOYMENT_BALANCE_BUFFER_NUMERATOR) /
    DEPLOYMENT_BALANCE_BUFFER_DENOMINATOR;

  if (balance < requiredWei) {
    throw new Error(
      `Insufficient deployer balance for ${deploymentLabel}. Address: ${account.address}. ` +
        `Available: ${formatEther(balance)} ETH. ` +
        `Estimated minimum required (including 20% buffer): ${formatEther(requiredWei)} ETH. ` +
        `Artifacts: ${gasEstimates.map(({ artifactPath }) => path.basename(artifactPath)).join(', ')}.`
    );
  }

  console.log(
    `✅ Deployer balance check passed for ${deploymentLabel}: ${formatEther(balance)} ETH available, ${formatEther(requiredWei)} ETH required with buffer across ${gasEstimates.length} contract deployment(s).`
  );

  const deployed: DeployedContracts = {};

  for (const { artifactPath, abi, bytecode } of artifacts) {
    const hash = await walletClient.deployContract({
      abi,
      bytecode
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success' || !receipt.contractAddress) {
      throw new Error('Contract deployment failed');
    }

    const contractName = path.basename(artifactPath, path.extname(artifactPath));
    deployed[contractName] = receipt.contractAddress as Address;
  }

  if (Array.isArray(artifactPathOrPaths)) {
    return deployed;
  }

  const contractName = path.basename(artifactPathOrPaths, path.extname(artifactPathOrPaths));
  const address = deployed[contractName];
  if (!address) {
    throw new Error(`Missing deployed address for contract: ${contractName}`);
  }
  return address;
}
