# Sample DApp - zkSync Prividium Integration

A Vue 3 + TypeScript sample application demonstrating secure smart contract interactions through Prividium Proxy API.

## Overview

This sample dApp showcases how to build a secure Web3 application that:

- Authenticates users through OIDC
- Connects to MetaMask wallets
- Interacts with smart contracts on zkSync Era through the Prividium proxy
- Implements proper transaction signing with EIP-712 support

## Features

- **Secure Authentication**: OAuth 2.0/OpenID Connect integration
- **Wallet Integration**: MetaMask connection with network switching
- **Smart Contract Interaction**: Complete CRUD operations on a Greeting contract
- **Transaction Management**: Real-time transaction history and status tracking
- **Proxy Integration**: All RPC calls routed through authenticated Prividium proxy
- **Responsive Design**: Modern UI with CSS custom properties and responsive layout

## Prerequisites

- Node.js 18+ and Yarn
- MetaMask browser extension
- Access to zkSync Era testnet/mainnet
- Running Prividium proxy service

## Quick Start

1. **Install dependencies**:

   ```bash
   yarn install
   ```

2. **Configure environment variables**: Create `.env` file (or copy `.env.example`) with:

   ```env
   # Smart Contract
   VITE_GREETING_CONTRACT_ADDRESS=0x...

   # Prividium Proxy
   VITE_PROXY_URL=http://localhost:4041/rpc

   # Network Configuration
   VITE_CHAIN_ID=324
   VITE_CHAIN_NAME=zkSync Era
   VITE_NATIVE_CURRENCY_SYMBOL=ETH
   ```

3. **Start development server**:

   ```bash
   yarn dev
   ```

4. **Open browser** to `http://localhost:4000`

## Architecture

### Tech Stack

- **Vue 3**: Composition API with TypeScript
- **Viem**: Ethereum library for wallet and contract interactions
- **Wagmi**: React hooks for Ethereum (Vue port)
- **Vite**: Build tool and development server

### Key Components

#### Authentication Flow

- **Login**: OIDC OAuth 2.0 with PKCE flow
- **Callback**: Handles authentication redirect
- **Protected Routes**: Automatic redirection based on auth state

#### Wallet Integration

- **MetaMask Connection**: Automatic wallet detection and connection
- **Network Switching**: Prompts to switch to correct network
- **Account Management**: Real-time account and network status

#### Smart Contract Integration

- **Read Operations**: `getGreeting()`, `getContractInfo()`, `owner()`, `updateCount()`
- **Write Operations**: `setGreeting()`, `updateGreeting()`, `transferOwnership()`
- **Transaction Signing**: EIP-712 compliant transaction signing
- **Proxy Communication**: All RPC calls authenticated through Prividium

### Project Structure

```
src/
├── main.ts                     # App entry point
├── App.vue                     # Root component
├── router/index.ts            # Vue Router with auth guards
├── views/
│   ├── LoginView.vue          # Login page
│   └── MainView.vue           # Main contract interface
├── composables/
│   ├── useWallet.ts           # Wallet connection management
│   ├── useRpcClient.ts        # Authenticated RPC client
│   └── useGreetingContract.ts # Smart contract interactions
├── wagmi.ts                   # Wagmi configuration
└── assets/                    # Styles and assets
```

## Smart Contract Interface

The sample interacts with a Greeting contract with the following functions:

### Read Functions

- `getGreeting()`: Returns current greeting message
- `getContractInfo()`: Returns greeting, owner, and update count
- `owner()`: Returns contract owner address
- `updateCount()`: Returns total number of updates

### Write Functions

- `setGreeting(string)`: Owner-only function to set greeting
- `updateGreeting(string)`: Public function to update greeting
- `transferOwnership(address)`: Transfer contract ownership

## Authentication & Security

### OIDC Integration

- OAuth 2.0 Authorization Code flow with PKCE
- Secure token storage and automatic refresh
- ID token passed to Prividium proxy for authorization

### Transaction Security

- EIP-712 structured data signing
- MetaMask signature verification
- Authenticated RPC calls through Prividium proxy

### Network Security

- All blockchain interactions routed through authenticated proxy
- Permission-based access control via Prividium
- No direct RPC endpoint exposure

## Development Commands

```bash
# Development
yarn dev          # Start development server
yarn preview      # Preview production build

# Build & Type Checking
yarn build        # Full production build
yarn build-only   # Build without type checking
yarn typecheck   # TypeScript type checking only
```

## Environment Variables

| Variable                         | Description              | Example                     |
| -------------------------------- | ------------------------ | --------------------------- |
| `VITE_GREETING_CONTRACT_ADDRESS` | Smart contract address   | `0x123...`                  |
| `VITE_PROXY_URL`                 | Prividium proxy endpoint | `http://localhost:4041/rpc` |
| `VITE_CHAIN_ID`                  | Network chain ID         | `324`                       |
| `VITE_CHAIN_NAME`                | Network display name     | `zkSync Era`                |
| `VITE_NATIVE_CURRENCY_SYMBOL`    | Native currency symbol   | `ETH`                       |

> **Note**: The sample dApp uses the authenticated `/rpc` endpoint for direct contract interaction calls. Network
> configuration (including personal RPC endpoints) should be done through the **user-panel** application.

## Usage Guide

### Prerequisites

Before using the sample dApp, you must add the Prividium network to MetaMask:

1. Navigate to the **user-panel** application
2. Sign in with the test Keycloak credentials
3. Use the "Add Network to Wallet" button to add the Prividium network with your personal RPC endpoint

### Using the Sample dApp

1. **Login**: Click "Sign In with Keycloak" to authenticate
2. **Connect Wallet**: Click "Connect Wallet" to connect MetaMask (ensure you're on the Prividium network)
3. **Enter Contract Address**: Input the deployed contract address
4. **Read Data**: Use read functions to query contract state
5. **Write Data**: Use write functions to modify contract state
6. **Monitor Transactions**: View transaction history and status
