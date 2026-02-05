# Prividium Template - Vue & Foundry Monorepo

Welcome to the ZKsync Prividium™ template! This monorepo provides a complete starting point for building privacy-focused decentralized applications on Prividium™ chains.

## TODOs

- [ ] Integrate ZKsync SSO smart accounts
- [ ] Add support for multiple chains in parallel

## Repository Structure

- [`web-app/`](./web-app): A Vue 3 + TypeScript frontend demonstrating PRividium authentication and secure RPC proxying to interact with smart contracts.
- [`contracts/`](./contracts): A basic Foundry-based project with a sample counter contract.
- [`setup-permissions/`](./setup-permissions): A setup script to configure permissions for the sample counter contract in the ZKsync Prividium™ ecosystem.

## Requirements

This project requires a target ZKsync Prividium™ chain to connect to. You can either run a local Prividium instance following the instructions in the [local Prividium repo](https://github.com/matter-labs/local-prividium) (requires access to private Docker registry) or use a remote Prividium instance.

- Node.js v22.10.0 or higher
- pnpm v9.16.1 or higher
- Foundry v1.0.0 or higher


## Quick Start

### 1. Install Dependencies

This project uses `pnpm` workspaces. Install everything from the root:

```bash
pnpm install
```

### 2. Configure Environment

Initialize the environment variables using the provided script:

```bash
pnpm setup-env
```

Then, update the values in the newly created `.env` files within `web-app/` and `contracts/` if needed.

### 3. Development

#### Web Application
Start the frontend with hot-reload:

```bash
pnpm dev
```

#### Smart Contracts
Compile and test your contracts:

```bash
pnpm --filter contracts build
pnpm --filter contracts test
```

## Global Scripts

We provide several convenient scripts at the root level:

- `pnpm build`: Builds all packages (Contracts & Web App).
- `pnpm test`: Runs tests across the entire workspace.
- `pnpm lint`: Runs Biome linter on all supported files.
- `pnpm format`: Automatically formats the codebase using Biome and Forge.
- `pnpm check`: Runs both linting and formatting verification.

## Architecture

This template is designed to work with **ZKsync Prividium**, utilizing:
- **OIDC Authentication**: Secure user login.
- **Prividium Proxy**: All blockchain interactions are routed through an authenticated proxy for enhanced security and privacy.
- **EIP-712**: Structured data signing for clear user intent.

For more details on each component, please check their respective README files:
- [Web App Documentation](./web-app/README.md)
- [Smart Contracts Documentation](./contracts/README.md)


## License

This project is licensed under the MIT License.
