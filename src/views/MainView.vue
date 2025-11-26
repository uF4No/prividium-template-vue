<template>
    <div class="main-container">
        <!-- User Welcome Banner -->
        <div v-if="isAuthenticated" class="user-banner">
            <div class="welcome-text">
                <h2>Welcome, {{ userName || userEmail || 'User' }}!</h2>
                <p>Interact with the Counter smart contract below</p>
            </div>
            <div class="user-actions">
                <!-- Wallet Connection -->
                <div class="wallet-section">
                    <div v-if="!wallet.isConnected.value" class="wallet-disconnected">
                        <button
                            :disabled="wallet.isConnecting.value"
                            class="connect-wallet-button"
                            @click="wallet.connectWallet"
                        >
                            {{ wallet.isConnecting.value ? 'Connecting...' : 'Connect Wallet' }}
                        </button>
                        <p class="wallet-info">Connect MetaMask to enable write functions</p>
                    </div>
                    <div v-else class="wallet-connected">
                        <div class="wallet-status">
                            <span class="wallet-address"
                                >{{ wallet.address.value?.slice(0, 6) }}...{{ wallet.address.value?.slice(-4) }}</span
                            >
                        </div>
                        <p v-if="!wallet.isCorrectNetwork.value" class="wallet-info network-help">
                            Please add the Prividium network via the <strong>user-panel</strong> application first
                        </p>
                        <div class="wallet-actions">
                            <button class="disconnect-wallet-button" @click="wallet.disconnectWallet">
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
                <button class="logout-button" @click="logout">Sign Out</button>
            </div>
        </div>

        <!-- Contract Interaction Interface -->
        <div class="contract-interface">
            <h1>Counter Contract</h1>
            <p>Interact with the deployed counter smart contract on zkSync Era</p>

            <!-- Error Message -->
            <div v-if="errorMessage" class="error-banner">
                <p>{{ errorMessage }}</p>
                <button class="close-error" @click="errorMessage = ''">×</button>
            </div>

            <!-- Connection Status -->
            <div class="connection-status" :class="{ connected: isConnected, disconnected: !isConnected }">
                <span class="status-indicator"></span>
                <span>{{ isConnected ? 'Connected to contract' : 'Not connected to contract' }}</span>
            </div>

            <!-- Contract Information Section -->
            <div class="section">
                <h3>Contract Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Contract Address:</label>
                        <div class="address-display">
                            <input v-model="contractAddress" type="text" placeholder="0x..." class="address-input" />
                            <button
                                class="connect-button"
                                :disabled="!contractAddress || isLoading"
                                @click="initializeContract"
                            >
                                {{ isConnected ? 'Connected' : 'Connect' }}
                            </button>
                        </div>
                    </div>
                    <div class="info-item">
                        <label>Current Counter Value:</label>
                        <div class="value-display">{{ counterValue || 'Not loaded' }}</div>
                    </div>
                    <!-- Commented out - not available in Counter contract
                    <div class="info-item">
                        <label>Contract Owner:</label>
                        <div class="value-display">{{ contractOwner || 'Not loaded' }}</div>
                    </div>
                    <div class="info-item">
                        <label>Update Count:</label>
                        <div class="value-display">{{ updateCount || 'Not loaded' }}</div>
                    </div>
                    -->
                </div>
            </div>

            <!-- Read Functions Section -->
            <div class="section">
                <h3>Read Functions</h3>
                <div class="function-grid">
                    <div class="function-card">
                        <h4>x()</h4>
                        <p>Returns the current counter value</p>
                        <button class="read-button" :disabled="!isConnected || isLoading" @click="getCounterValue">
                            {{ isLoading ? 'Loading...' : 'Get Counter Value' }}
                        </button>
                    </div>

                    <!-- Commented out - not available in Counter contract
                    <div class="function-card">
                        <h4>getContractInfo()</h4>
                        <p>Returns greeting, owner, and update count</p>
                        <button class="read-button" :disabled="!isConnected || isLoading" @click="getContractInfo">
                            {{ isLoading ? 'Loading...' : 'Get Contract Info' }}
                        </button>
                    </div>

                    <div class="function-card">
                        <h4>owner()</h4>
                        <p>Returns the contract owner address</p>
                        <button class="read-button" :disabled="!isConnected || isLoading" @click="getOwner">
                            {{ isLoading ? 'Loading...' : 'Get Owner' }}
                        </button>
                    </div>

                    <div class="function-card">
                        <h4>updateCount()</h4>
                        <p>Returns the total number of updates</p>
                        <button class="read-button" :disabled="!isConnected || isLoading" @click="getUpdateCount">
                            {{ isLoading ? 'Loading...' : 'Get Update Count' }}
                        </button>
                    </div>
                    -->
                </div>
            </div>

            <!-- Write Functions Section -->
            <div class="section">
                <h3>Write Functions</h3>
                <div class="function-grid">
                    <div class="function-card">
                        <h4>inc()</h4>
                        <p>Increment counter by 1</p>
                        <button
                            class="write-button"
                            :disabled="isLoading"
                            @click="incrementCounter"
                        >
                            {{ isLoading ? 'Processing...' : 'Increment by 1' }}
                        </button>
                    </div>

                    <div class="function-card">
                        <h4>incBy(uint256)</h4>
                        <p>Increment counter by specified amount</p>
                        <div class="input-group">
                            <input
                                v-model="incrementAmount"
                                type="number"
                                min="1"
                                placeholder="Enter amount..."
                                class="text-input"
                            />
                            <button
                                class="write-button"
                                :disabled="!incrementAmount || parseInt(incrementAmount) <= 0 || isLoading"
                                @click="incrementCounterBy"
                            >
                                {{ isLoading ? 'Processing...' : 'Increment by Amount' }}
                            </button>
                        </div>
                    </div>

                    <!-- Commented out - not available in Counter contract
                    <div class="function-card">
                        <h4>setGreeting(string)</h4>
                        <p>Owner-only function to set greeting</p>
                        <div class="input-group">
                            <input
                                v-model="newGreetingOwner"
                                type="text"
                                placeholder="Enter new greeting..."
                                class="text-input"
                            />
                            <button
                                class="write-button"
                                :disabled="!newGreetingOwner || isLoading"
                                @click="setGreeting"
                            >
                                {{ isLoading ? 'Processing...' : 'Set Greeting (Owner)' }}
                            </button>
                        </div>
                    </div>

                    <div class="function-card">
                        <h4>updateGreeting(string)</h4>
                        <p>Public function to update greeting</p>
                        <div class="input-group">
                            <input
                                v-model="newGreetingPublic"
                                type="text"
                                placeholder="Enter new greeting..."
                                class="text-input"
                            />
                            <button
                                class="write-button"
                                :disabled="!newGreetingPublic || isLoading"
                                @click="updateGreeting"
                            >
                                {{ isLoading ? 'Processing...' : 'Update Greeting (Public)' }}
                            </button>
                        </div>
                    </div>

                    <div class="function-card">
                        <h4>transferOwnership(address)</h4>
                        <p>Transfer contract ownership to new address</p>
                        <div class="input-group">
                            <input v-model="newOwnerAddress" type="text" placeholder="0x..." class="text-input" />
                            <button
                                class="write-button danger"
                                :disabled="!newOwnerAddress || isLoading"
                                @click="transferOwnership"
                            >
                                {{ isLoading ? 'Processing...' : 'Transfer Ownership' }}
                            </button>
                        </div>
                    </div>
                    -->
                </div>
            </div>

            <!-- Transaction History -->
            <div class="section">
                <h3>Transaction History</h3>
                <div class="transaction-list">
                    <div v-if="transactions.length === 0" class="transaction-item">
                        <p>No transactions yet. Connect to contract and start interacting!</p>
                    </div>
                    <div v-for="tx in transactions" :key="tx.id" class="transaction-item">
                        <div class="tx-info">
                            <span class="tx-function">{{ tx.function }}</span>
                            <span class="tx-status" :class="tx.status">{{ tx.status }}</span>
                        </div>
                        <div class="tx-hash">{{ tx.hash }}</div>
                        <div class="tx-time">{{ tx.timestamp }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePrividium } from '../composables/usePrividium';
import { useWallet } from '../composables/useWallet';
import { type Address, type PublicClient } from 'viem';
// import { useGreetingContract } from '@/composables/useGreetingContract'; // Commented out - using Counter contract
import { getContract, encodeFunctionData } from 'viem';
import { useRpcClient } from '@/composables/useRpcClient';

const router = useRouter();
const { isAuthenticated, userName, userEmail, signOut: prividiumSignOut, enableWalletToken } = usePrividium();

// Wallet integration
const wallet = useWallet();

// Contract connection data
const counterValue = ref('');
// Commented out - not available in Counter contract
// const contractOwner = ref('');
// const updateCount = ref('');

// Form inputs
const incrementAmount = ref('');
// Commented out - not available in Counter contract
// const newGreetingOwner = ref('');
// const newGreetingPublic = ref('');
// const newOwnerAddress = ref('');

// Transaction history
const transactions = ref<
    Array<{
        id: string;
        function: string;
        status: 'pending' | 'success' | 'failed';
        hash: string;
        timestamp: string;
    }>
>([]);

// RPC Client
const rpcClient = useRpcClient();

// Counter Contract ABI
const COUNTER_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "by",
                "type": "uint256"
            }
        ],
        "name": "Increment",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "inc",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "by",
                "type": "uint256"
            }
        ],
        "name": "incBy",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "x",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

// Contract instance
const contractAddress = import.meta.env.VITE_COUNTER_CONTRACT_ADDRESS as Address;
const counterContract = getContract({
    address: contractAddress,
    abi: COUNTER_ABI,
    client: rpcClient.value as PublicClient
});
const isConnected = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

// Initialize RPC client and contract
const initializeContract = async () => {
    try {
        await loadContractInfo();
        isConnected.value = true;
        errorMessage.value = '';
    } catch (error) {
        console.error('Failed to initialize contract:', error);
        errorMessage.value = 'Failed to connect to contract';
        isConnected.value = false;
    }
};

// Load contract information
const loadContractInfo = async () => {
    try {
        isLoading.value = true;
        const value = await counterContract.read.x();
        counterValue.value = value.toString();
    } catch (error) {
        console.error('Failed to load contract info:', error);
        errorMessage.value = 'Failed to load contract information';
    } finally {
        isLoading.value = false;
    }
};

// Read function handlers
const getCounterValue = async () => {
    try {
        isLoading.value = true;
        const value = await counterContract.read.x();
        counterValue.value = value.toString();
        addTransaction('x()', 'success', '', 'Read operation completed');
    } catch (error) {
        console.error('Failed to get counter value:', error);
        addTransaction('x()', 'failed', '', 'Read operation failed');
        errorMessage.value = 'Failed to get counter value';
    } finally {
        isLoading.value = false;
    }
};

// Commented out - not available in Counter contract
/*
const getContractInfo = async () => {
    await loadContractInfo();
    if (!errorMessage.value) {
        addTransaction('getContractInfo()', 'success', '', 'Read operation completed');
    }
};

const getOwner = async () => {
    try {
        isLoading.value = true;
        const owner = await greetingContract.getOwner();
        contractOwner.value = owner;
        addTransaction('owner()', 'success', '', 'Read operation completed');
    } catch (error) {
        console.error('Failed to get owner:', error);
        addTransaction('owner()', 'failed', '', 'Read operation failed');
        errorMessage.value = 'Failed to get owner';
    } finally {
        isLoading.value = false;
    }
};

const getUpdateCount = async () => {
    try {
        isLoading.value = true;
        const count = await greetingContract.getUpdateCount();
        updateCount.value = count.toString();
        addTransaction('updateCount()', 'success', '', 'Read operation completed');
    } catch (error) {
        console.error('Failed to get update count:', error);
        addTransaction('updateCount()', 'failed', '', 'Read operation failed');
        errorMessage.value = 'Failed to get update count';
    } finally {
        isLoading.value = false;
    }
};
*/

// Write function handlers
const incrementCounter = async () => {
    try {
        await wallet.ensureWalletReady();

        isLoading.value = true;
        addTransaction('inc()', 'pending', '', 'Transaction submitted');

        // Use the same pattern as the working sample-dapp
        const data = encodeFunctionData({
            abi: COUNTER_ABI,
            functionName: 'inc',
            args: []
        });

        // Get nonce
        const nonce = await rpcClient.value!.getTransactionCount({
            address: wallet.address.value!
        });

        // Enable transaction allowance before sending
        console.log('Enabling transaction allowance...');
        await enableWalletToken({
            walletAddress: wallet.address.value!,
            contractAddress,
            nonce,
            calldata: data
        });
        console.log('Transaction allowance enabled successfully');

        // Estimate gas
        const gas = await rpcClient.value!.estimateGas({
            account: wallet.address.value!,
            to: contractAddress,
            data
        });

        // Get gas price
        const gasPrice = await rpcClient.value!.getGasPrice();

        const hash = await wallet.walletClient.value!.sendTransaction({
            account: wallet.walletClient.value!.account!,
            to: contractAddress,
            data,
            nonce,
            gas,
            gasPrice
        });

        addTransaction('inc()', 'success', hash, `Transaction: ${hash}`);

        // Refresh contract info
        await loadContractInfo();
    } catch (error) {
        console.error('Failed to increment counter:', error);
        addTransaction('inc()', 'failed', '', 'Transaction failed');
        errorMessage.value = error instanceof Error ? error.message : 'Failed to increment counter';
    } finally {
        isLoading.value = false;
    }
};

const incrementCounterBy = async () => {
    try {
        await wallet.ensureWalletReady();

        isLoading.value = true;
        addTransaction('incBy()', 'pending', '', 'Transaction submitted');

        // Use the same pattern as the working sample-dapp
        const data = encodeFunctionData({
            abi: COUNTER_ABI,
            functionName: 'incBy',
            args: [BigInt(incrementAmount.value)]
        });

        // Get nonce
        const nonce = await rpcClient.value!.getTransactionCount({
            address: wallet.address.value!
        });

        // Enable transaction allowance before sending
        console.log('Enabling transaction allowance...');
        await enableWalletToken({
            walletAddress: wallet.address.value!,
            contractAddress,
            nonce,
            calldata: data
        });
        console.log('Transaction allowance enabled successfully');

        // Estimate gas
        const gas = await rpcClient.value!.estimateGas({
            account: wallet.address.value!,
            to: contractAddress,
            data
        });

        // Get gas price
        const gasPrice = await rpcClient.value!.getGasPrice();

        const hash = await wallet.walletClient.value!.sendTransaction({
            account: wallet.walletClient.value!.account!,
            to: contractAddress,
            data,
            nonce,
            gas,
            gasPrice
        });

        addTransaction('incBy()', 'success', hash, `Transaction: ${hash}`);

        // Refresh contract info
        await loadContractInfo();
        incrementAmount.value = '';
    } catch (error) {
        console.error('Failed to increment counter by amount:', error);
        addTransaction('incBy()', 'failed', '', 'Transaction failed');
        errorMessage.value = error instanceof Error ? error.message : 'Failed to increment counter by amount';
    } finally {
        isLoading.value = false;
    }
};

// Commented out - not available in Counter contract
/*
const setGreeting = async () => {
    try {
        await wallet.ensureWalletReady();

        isLoading.value = true;
        addTransaction('setGreeting()', 'pending', '', 'Transaction submitted');

        const hash = await greetingContract.setGreeting(newGreetingOwner.value);
        addTransaction('setGreeting()', 'success', hash, `Transaction: ${hash}`);

        // Refresh contract info
        await loadContractInfo();
        newGreetingOwner.value = '';
    } catch (error) {
        console.error('Failed to set greeting:', error);
        addTransaction('setGreeting()', 'failed', '', 'Transaction failed');
        errorMessage.value = error instanceof Error ? error.message : 'Failed to set greeting';
    } finally {
        isLoading.value = false;
    }
};

const updateGreeting = async () => {
    try {
        // Ensure wallet is ready
        await wallet.ensureWalletReady();

        isLoading.value = true;
        addTransaction('updateGreeting()', 'pending', '', 'Transaction submitted');

        const hash = await greetingContract.updateGreeting(newGreetingPublic.value);
        addTransaction('updateGreeting()', 'success', hash, `Transaction: ${hash}`);

        // Refresh contract info
        await loadContractInfo();
        newGreetingPublic.value = '';
    } catch (error) {
        console.error('Failed to update greeting:', error);
        addTransaction('updateGreeting()', 'failed', '', 'Transaction failed');
        errorMessage.value = error instanceof Error ? error.message : 'Failed to update greeting';
    } finally {
        isLoading.value = false;
    }
};

const transferOwnership = async () => {
    try {
        // Ensure wallet is ready
        await wallet.ensureWalletReady();

        isLoading.value = true;
        addTransaction('transferOwnership()', 'pending', '', 'Transaction submitted');

        const hash = await greetingContract.transferOwnership(newOwnerAddress.value as Address);
        addTransaction('transferOwnership()', 'success', hash, `Transaction: ${hash}`);

        // Refresh contract info
        await loadContractInfo();
        newOwnerAddress.value = '';
    } catch (error) {
        console.error('Failed to transfer ownership:', error);
        addTransaction('transferOwnership()', 'failed', '', 'Transaction failed');
        errorMessage.value = error instanceof Error ? error.message : 'Failed to transfer ownership';
    } finally {
        isLoading.value = false;
    }
};
*/

// Helper function to add transactions to history
const addTransaction = (func: string, status: 'pending' | 'success' | 'failed', hash: string, description: string) => {
    transactions.value.unshift({
        id: Date.now().toString(),
        function: func,
        status,
        hash: hash || description,
        timestamp: new Date().toLocaleString()
    });
};

// Initialize on mount
onMounted(async () => {
    if (isAuthenticated.value) {
        try {
            await initializeContract();
        } catch (error) {
            console.error('Error initializing contract:', error);
        }
    } else {
        // Redirect to login if not authenticated
        void router.push('/login');
    }
});

const logout = () => {
    try {
        prividiumSignOut();
        void router.push('/login');
    } catch (error) {
        console.error('Logout error:', error);
    }
};

onUnmounted(() => {
    wallet.cleanup();
});
</script>

<style scoped>
.main-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
    background: var(--color-background);
}

.user-info {
    background: var(--color-surface);
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    border: 1px solid var(--color-border);
    border-left: 4px solid var(--color-primary-500);
}

.user-info h2 {
    margin: 0 0 0.5rem 0;
    color: var(--color-heading);
    font-weight: 600;
}

.user-info p {
    margin: 0;
    color: var(--color-text-muted);
}

.content {
    background: var(--color-surface);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.content h1 {
    color: var(--color-heading);
    margin-bottom: 1rem;
    font-weight: 600;
}

.content > p {
    color: var(--color-text-soft);
    margin-bottom: 2rem;
    line-height: 1.6;
}

.user-details {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--color-background-soft);
    border-radius: 8px;
    border: 1px solid var(--color-border);
}

.user-details h3 {
    margin: 0 0 1rem 0;
    color: var(--color-heading);
    font-weight: 600;
}

.info-grid {
    display: grid;
    gap: 1rem;
}

.info-item {
    padding: 0.75rem 1rem;
    background: var(--color-surface);
    border-radius: 6px;
    border: 1px solid var(--color-border);
}

.info-item strong {
    color: var(--color-text-soft);
}

.actions {
    margin-top: 2rem;
    text-align: center;
}

.logout-button {
    background: var(--color-danger-500);
    color: var(--color-white);
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.logout-button:hover {
    background: var(--color-danger-600);
    transform: translateY(-1px);
}

.logout-button:active {
    transform: translateY(0);
}

.logout-button:disabled {
    background: var(--color-gray-300);
    color: var(--color-gray-500);
    cursor: not-allowed;
    transform: none;
}

/* User Banner Styles */
.user-banner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: var(--color-surface);
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 2rem;
    border: 1px solid var(--color-border);
    border-left: 4px solid var(--color-primary-500);
    gap: 2rem;
}

.user-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* Wallet Section Styles */
.wallet-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.wallet-disconnected {
    text-align: center;
}

.wallet-connected {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.wallet-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
}

.wallet-address {
    background: var(--color-background-soft);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.network-warning {
    background: #fee2e2;
    color: #991b1b;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
}

.network-correct {
    background: #d1fae5;
    color: #065f46;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
}

.wallet-actions {
    display: flex;
    gap: 0.5rem;
}

.connect-wallet-button {
    background: var(--color-primary-500);
    color: var(--color-white);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.connect-wallet-button:hover:not(:disabled) {
    background: var(--color-primary-600);
    transform: translateY(-1px);
}

.connect-wallet-button:disabled {
    background: var(--color-gray-300);
    color: var(--color-gray-500);
    cursor: not-allowed;
    transform: none;
}

.network-help {
    color: #f59e0b;
    margin: 0.5rem 0;
    font-size: 0.875rem;
}

.disconnect-wallet-button {
    background: var(--color-gray-400);
    color: var(--color-white);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.disconnect-wallet-button:hover {
    background: var(--color-gray-500);
    transform: translateY(-1px);
}

.wallet-info {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin: 0.5rem 0 0 0;
}

.welcome-text h2 {
    margin: 0 0 0.5rem 0;
    color: var(--color-heading);
    font-weight: 600;
}

.welcome-text p {
    margin: 0;
    color: var(--color-text-muted);
}

/* Contract Interface Styles */
.contract-interface {
    background: var(--color-surface);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Error Banner */
.error-banner {
    display: flex;
    justify-content: space-between;
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    word-break: break-all;
    gap: 1rem;
}

.error-banner p {
    margin: 0;
    font-weight: 500;
}

.close-error {
    background: none;
    border: none;
    color: #991b1b;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-error:hover {
    background: rgba(153, 27, 27, 0.1);
    border-radius: 4px;
}

/* Connection Status */
.connection-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-weight: 500;
    font-size: 0.875rem;
}

.connection-status.connected {
    background: #d1fae5;
    border: 1px solid #a7f3d0;
    color: #065f46;
}

.connection-status.disconnected {
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
}

.status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
}

.connected .status-indicator {
    background: #10b981;
}

.disconnected .status-indicator {
    background: #ef4444;
}

.contract-interface h1 {
    color: var(--color-heading);
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.contract-interface > p {
    color: var(--color-text-soft);
    margin-bottom: 2rem;
    line-height: 1.6;
}

.section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--color-border);
}

.section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.section h3 {
    color: var(--color-heading);
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: 1.25rem;
}

/* Contract Information Grid */
.info-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.info-item {
    padding: 1rem;
    background: var(--color-background-soft);
    border-radius: 8px;
    border: 1px solid var(--color-border);
}

.info-item label {
    display: block;
    font-weight: 600;
    color: var(--color-text-soft);
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
}

.value-display {
    color: var(--color-text);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    padding: 0.5rem;
    background: var(--color-surface);
    border-radius: 4px;
    border: 1px solid var(--color-border);
    word-break: break-all;
}

.address-display {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.address-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
}

.address-input:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.connect-button {
    padding: 0.5rem 1rem;
    background: var(--color-primary-500);
    color: var(--color-white);
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.connect-button:hover:not(:disabled) {
    background: var(--color-primary-600);
}

.connect-button:disabled {
    background: var(--color-gray-300);
    color: var(--color-gray-500);
    cursor: not-allowed;
}

/* Function Grid */
.function-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.function-card {
    padding: 1.5rem;
    background: var(--color-background-soft);
    border-radius: 8px;
    border: 1px solid var(--color-border);
    transition: border-color 0.2s ease;
}

.function-card:hover {
    border-color: var(--color-border-hover);
}

.function-card h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-heading);
    font-weight: 600;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 1rem;
}

.function-card p {
    margin: 0 0 1rem 0;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    line-height: 1.5;
}

/* Input Group */
.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.text-input {
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
}

.text-input:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Buttons */
.read-button {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary-500);
    color: var(--color-white);
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
}

.read-button:hover {
    background: var(--color-primary-600);
    transform: translateY(-1px);
}

.read-button:active {
    transform: translateY(0);
}

.write-button {
    padding: 0.75rem 1.5rem;
    background: var(--color-success-500);
    color: var(--color-white);
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
}

.write-button:hover:not(:disabled) {
    background: var(--color-success-600);
    transform: translateY(-1px);
}

.write-button:active {
    transform: translateY(0);
}

.write-button:disabled {
    background: var(--color-gray-300);
    color: var(--color-gray-500);
    cursor: not-allowed;
    transform: none;
}

.write-button.danger {
    background: var(--color-danger-500);
}

.write-button.danger:hover:not(:disabled) {
    background: var(--color-danger-600);
}

/* Transaction History */
.transaction-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-background-soft);
}

.transaction-item {
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
}

.transaction-item:last-child {
    border-bottom: none;
}

.tx-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.tx-function {
    font-weight: 600;
    color: var(--color-text);
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
}

.tx-status {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.tx-status.pending {
    background: #fef3c7;
    color: #92400e;
}

.tx-status.success {
    background: #d1fae5;
    color: #065f46;
}

.tx-status.failed {
    background: #fee2e2;
    color: #991b1b;
}

.tx-hash {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
    word-break: break-all;
}

.tx-time {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

@media (max-width: 768px) {
    .main-container {
        padding: 1rem;
    }

    .contract-interface {
        padding: 1.5rem;
    }

    .user-banner {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
        align-items: center;
    }

    .user-actions {
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
    }

    .wallet-section {
        order: -1;
        width: 100%;
    }

    .wallet-actions {
        justify-content: center;
    }

    .info-grid,
    .function-grid {
        grid-template-columns: 1fr;
    }

    .address-display {
        flex-direction: column;
    }

    .input-group {
        gap: 0.5rem;
    }
}
</style>
