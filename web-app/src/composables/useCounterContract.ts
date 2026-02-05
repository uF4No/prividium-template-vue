import { type Address, encodeFunctionData, getContract, type PublicClient } from 'viem';
import { useTransactionAllowance } from './useTransactionAllowance';
import { useWallet } from './useWallet';
import { prividiumChain } from '../wagmi';

// Counter Contract ABI
export const counterAbi = [
  {
    inputs: [],
    name: 'inc',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'y',
        type: 'uint256'
      }
    ],
    name: 'incBy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'x',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export function useCounterContract(contractAddress: Address, rpcClient: PublicClient) {
  const wallet = useWallet();
  const { enableTransactionAllowance } = useTransactionAllowance();
  
  const contract = getContract({
    address: contractAddress,
    abi: counterAbi,
    client: rpcClient
  });

  // Read functions
  const getValue = async (): Promise<bigint> => {
    return await contract.read.x();
  };

  // Internal helper for defensive checks (matching React)
  const verifyWalletState = async () => {
    await wallet.ensureWalletReady();

    if (window.ethereum) {
      const ethereum = window.ethereum as any;
      
      // 1. Verify Chain ID
      const currentChainId = await ethereum.request({ method: 'eth_chainId' });
      const expectedChainId = `0x${prividiumChain.id.toString(16)}`;
      if (currentChainId !== expectedChainId) {
        throw new Error(`Wallet is on wrong network. Current: ${currentChainId}, Required: ${expectedChainId}.`);
      }

      // 2. Verify Account
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      const activeAddress = accounts[0]?.toLowerCase();
      const expectedAddress = wallet.address.value?.toLowerCase();
      
      if (!activeAddress || activeAddress !== expectedAddress) {
        await ethereum.request({ method: 'eth_requestAccounts' });
      }
    }

    if (!wallet.walletClient.value) throw new Error('Wallet client not found');
    if (!wallet.address.value) throw new Error('Wallet address not found');
  };

  // Write functions
  const increment = async () => {
    await verifyWalletState();
    const walletAddress = wallet.address.value!;
    const client = wallet.walletClient.value!;

    const data = encodeFunctionData({
      abi: counterAbi,
      functionName: 'inc',
      args: []
    });

    // 1. Get Nonce
    const nonce = await rpcClient.getTransactionCount({
      address: walletAddress
    });
    
    // 2. Enable Token (The "Permission" Step) - Done BEFORE gas estimation to ensure proxy allows the call
    await enableTransactionAllowance({
      walletAddress,
      contractAddress,
      nonce: Number(nonce),
      calldata: data
    });

    // 3. Pre-fetch Parameters
    const gas = await rpcClient.estimateGas({
      account: walletAddress,
      to: contractAddress,
      data
    });

    const gasPrice = await rpcClient.getGasPrice();

    // 4. Final verification of client chain
    const walletChainId = await client.getChainId();
    if (walletChainId !== prividiumChain.id) {
      throw new Error(`Wallet client chain mismatch. Expected ${prividiumChain.id}, got ${walletChainId}`);
    }

    // 5. Send Transaction
    const hash = await client.sendTransaction({
      account: walletAddress,
      to: contractAddress,
      data,
      nonce: Number(nonce),
      gas,
      gasPrice
    });
    
    return hash;
  };

  const incrementBy = async (amount: bigint) => {
    await verifyWalletState();
    const walletAddress = wallet.address.value!;
    const client = wallet.walletClient.value!;

    const data = encodeFunctionData({
      abi: counterAbi,
      functionName: 'incBy',
      args: [amount]
    });

    // 1. Get Nonce
    const nonce = await rpcClient.getTransactionCount({
      address: walletAddress
    });

    // 2. Enable Token
    await enableTransactionAllowance({
      walletAddress,
      contractAddress,
      nonce: Number(nonce),
      calldata: data
    });

    // 3. Pre-fetch Parameters
    const gas = await rpcClient.estimateGas({
      account: walletAddress,
      to: contractAddress,
      data
    });

    const gasPrice = await rpcClient.getGasPrice();

    // 4. Final verification
    const walletChainId = await client.getChainId();
    if (walletChainId !== prividiumChain.id) {
       throw new Error(`Wallet client chain mismatch. Expected ${prividiumChain.id}, got ${walletChainId}`);
    }

    // 5. Send Transaction
    const hash = await client.sendTransaction({
      account: walletAddress,
      to: contractAddress,
      data,
      nonce: Number(nonce),
      gas,
      gasPrice
    });
    
    return hash;
  };

  return {
    contract,
    getValue,
    increment,
    incrementBy
  };
}
