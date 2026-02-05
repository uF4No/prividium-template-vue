# setup-permissions

This package provides a template for automating the deployment and configuration of smart contracts and OAuth applications within the Prividium™ ecosystem. 

It is designed to be easily extendable, allowing you to quickly bootstrap setup scripts for your own demos and production applications.

## Features

- **Service Validation**: Checks that Prividium API and ZKsync OS (chain) are up and running.
- **Automated Authentication**: Handles SIWE-based crypto-native authentication for admin tasks.
- **Contract Deployment**: Deploys smart contracts using Foundry (`forge`).
- **Prividium Configuration**: 
  - Registers OAuth applications.
  - Registers smart contracts with their ABIs.
  - Configures granular permissions (public, role-based, argument-restricted).
- **Environment Management**: Automatically updates `.env` files in your web applications with generated values (contract addresses, client IDs).

## Installation

From the root of the repository:

```bash
pnpm install
```

## Setup & Usage

### 1. Prerequisites

Ensure your Prividium environment is running and configured in `web-app/.env`:

- **Chain**: ZKsync OS RPC URL (`VITE_PROXY_URL`)
- **API**: Prividium Permissions API URL (`VITE_PERMISSIONS_API_URL`)
- **Auth**: Prividium Auth Service URL (`VITE_AUTH_BASE_URL`)

### 2. Run the Setup

```bash
cd setup-permissions
pnpm setup
```

This script will execute the flow defined in `src/main.ts`, which by default:
1. Validates connectivity to the chain and API.
2. Authenticates as an admin.
3. Deploys the `Counter` contract and registers the `web-app`.

## Extending the Template

This package is built to be adapted. Here is how you can use it for your own use cases:

### 1. Adding a New Contract

1. Place your Solidity contract in the `contracts/src/` directory.
2. Create a new setup file in `src/setups/` (e.g., `my-app-setup.ts`).
3. Follow the pattern in `counter-setup.ts`:
   - Identify the workspace directories.
   - Use `deployAndExtractAddress` to deploy the contract.
   - Use `api-client` helpers to register the application, contract, and permissions.

### 2. Customizing Permissions

You can configure complex access rules in your setup file:

```typescript
// Example: Restricting a function to a specific role
await postContractPermissions(adminApiClient, {
    contractAddress: myContractAddress,
    functionSignature: 'secureFunction(uint256)',
    methodSelector: toFunctionSelector('function secureFunction(uint256)'),
    accessType: 'write',
    ruleType: 'checkRole', // Options: 'public', 'checkRole', 'restrictArgument'
    roles: [{ roleName: 'manager' }],
    argumentRestrictions: []
});
```

### 3. Supporting Multiple Apps

In `src/main.ts`, you can add more tasks or logic to iterate through multiple application directories and configure them separately based on your project structure.

## Architecture

- `src/main.ts`: The entry point that orchestrates the setup flow.
- `src/tools/api-client.ts`: A lightweight, fetch-based client for the Prividium Admin API.
- `src/tools/deploy.ts`: Wrapper for Foundry deployment scripts.
- `src/tools/config-tools.ts`: Utilities for reading and writing `.env` files.
- `src/setups/`: Contains logic specific to individual applications or demos.

## Troubleshooting

- **Connectivity**: Ensure the URLs in `web-app/.env` are reachable from this package.
- **Admin Auth**: The setup uses a default admin private key. Ensure this key corresponds to an admin in your Prividium instance.
- **Foundry**: Contract deployment requires `forge` to be installed and available in your PATH.
- **ABI Extraction**: Ensure your contracts are compiled (`forge build`) so the ABI is available in the `out/` directory.
