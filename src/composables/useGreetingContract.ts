import { getContract, type Address, encodeFunctionData, type PublicClient } from 'viem';
import { useWallet } from './useWallet';
import { useTransactionAllowance } from './useTransactionAllowance';

// Greeting Contract ABI
export const greetingAbi = [
    {
        inputs: [{ internalType: 'string', name: '_greeting', type: 'string' }],
        stateMutability: 'nonpayable',
        type: 'constructor'
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, internalType: 'string', name: 'oldGreeting', type: 'string' },
            { indexed: false, internalType: 'string', name: 'newGreeting', type: 'string' },
            { indexed: false, internalType: 'address', name: 'updatedBy', type: 'address' }
        ],
        name: 'GreetingUpdated',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
            { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' }
        ],
        name: 'OwnershipTransferred',
        type: 'event'
    },
    {
        inputs: [],
        name: 'getContractInfo',
        outputs: [
            { internalType: 'string', name: '', type: 'string' },
            { internalType: 'address', name: '', type: 'address' },
            { internalType: 'uint256', name: '', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'getGreeting',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ internalType: 'string', name: '_greeting', type: 'string' }],
        name: 'setGreeting',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'updateCount',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [{ internalType: 'string', name: '_greeting', type: 'string' }],
        name: 'updateGreeting',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const;

export function useGreetingContract(contractAddress: Address, rpcClient: PublicClient) {
    const contract = getContract({
        address: contractAddress,
        abi: greetingAbi,
        client: rpcClient
    });

    // Read functions
    const getGreeting = async (): Promise<string> => {
        return await contract.read.getGreeting();
    };

    const getContractInfo = async () => {
        const [greeting, owner, updateCount] = await contract.read.getContractInfo();
        return {
            greeting,
            owner,
            updateCount
        };
    };

    const getOwner = async () => {
        return await contract.read.owner();
    };

    const getUpdateCount = async () => {
        return await contract.read.updateCount();
    };

    // Write functions
    const setGreeting = async (greeting: string) => {
        const { walletClient, address: walletAddress } = useWallet();
        const { enableTransactionAllowance } = useTransactionAllowance();

        if (!walletClient.value) {
            throw new Error('Wallet client not found');
        }

        if (!walletAddress.value) {
            throw new Error('Wallet address not found');
        }

        const data = encodeFunctionData({
            abi: greetingAbi,
            functionName: 'setGreeting',
            args: [greeting]
        });

        // Get nonce
        const nonce = await rpcClient.getTransactionCount({
            address: walletAddress.value
        });

        // Enable transaction allowance before sending
        console.log('Enabling transaction allowance...');
        await enableTransactionAllowance({
            walletAddress: walletAddress.value,
            contractAddress,
            nonce,
            calldata: data
        });
        console.log('Transaction allowance enabled successfully');

        // Estimate gas
        const gas = await rpcClient.estimateGas({
            account: walletAddress.value,
            to: contractAddress,
            data
        });

        // Get gas price
        const gasPrice = await rpcClient.getGasPrice();

        console.log('Sending transaction with nonce:', nonce);
        console.log('Sending transaction with gas:', gas);
        console.log('Sending transaction with gas price:', gasPrice);
        console.log('Sending transaction with data:', data);
        console.log('Sending transaction with to:', contractAddress);
        console.log('Sending transaction with account:', walletClient.value.account!);

        const hash = await walletClient.value.sendTransaction({
            account: walletClient.value.account!,
            to: contractAddress,
            data,
            nonce,
            gas,
            gasPrice
        });
        return hash;
    };

    const updateGreeting = async (greeting: string) => {
        const { walletClient, address: walletAddress } = useWallet();
        const { enableTransactionAllowance } = useTransactionAllowance();

        if (!walletClient.value) {
            throw new Error('Wallet client not found');
        }

        if (!walletAddress.value) {
            throw new Error('Wallet address not found');
        }

        const data = encodeFunctionData({
            abi: greetingAbi,
            functionName: 'updateGreeting',
            args: [greeting]
        });

        // Get nonce
        const nonce = await rpcClient.getTransactionCount({
            address: walletAddress.value
        });

        // Enable transaction allowance before sending
        console.log('Enabling transaction allowance...');
        await enableTransactionAllowance({
            walletAddress: walletAddress.value,
            contractAddress,
            nonce,
            calldata: data
        });
        console.log('Transaction allowance enabled successfully');

        // Estimate gas
        const gas = await rpcClient.estimateGas({
            account: walletAddress.value,
            to: contractAddress,
            data
        });

        // Get gas price
        const gasPrice = await rpcClient.getGasPrice();

        const hash = await walletClient.value.sendTransaction({
            account: walletClient.value.account!,
            to: contractAddress,
            data,
            nonce,
            gas,
            gasPrice
        });
        return hash;
    };

    const transferOwnership = async (newOwner: Address) => {
        const { walletClient, address: walletAddress } = useWallet();
        const { enableTransactionAllowance } = useTransactionAllowance();

        if (!walletClient.value) {
            throw new Error('Wallet client not found');
        }

        if (!walletAddress.value) {
            throw new Error('Wallet address not found');
        }

        const data = encodeFunctionData({
            abi: greetingAbi,
            functionName: 'transferOwnership',
            args: [newOwner]
        });

        // Get nonce
        const nonce = await rpcClient.getTransactionCount({
            address: walletAddress.value
        });

        // Enable transaction allowance before sending
        console.log('Enabling transaction allowance...');
        await enableTransactionAllowance({
            walletAddress: walletAddress.value,
            contractAddress,
            nonce,
            calldata: data
        });
        console.log('Transaction allowance enabled successfully');

        // Estimate gas
        const gas = await rpcClient.estimateGas({
            account: walletAddress.value,
            to: contractAddress,
            data
        });

        // Get gas price
        const gasPrice = await rpcClient.getGasPrice();

        const hash = await walletClient.value.sendTransaction({
            account: walletClient.value.account!,
            to: contractAddress,
            data,
            nonce,
            gas,
            gasPrice
        });
        return hash;
    };

    return {
        contract,
        getGreeting,
        getContractInfo,
        getOwner,
        getUpdateCount,
        setGreeting,
        updateGreeting,
        transferOwnership
    };
}
