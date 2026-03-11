# Testing Guide

This repository uses a three-layer test model:

1. Unit/component tests (`backend`, `setup`, `web-app`) with mocked network dependencies.
2. Contracts tests (`forge test`) in `contracts/`.
3. Deployment/API integration checks split into:
   - Anvil smoke test in CI (`setup/test/smoke`).
   - Live Prividium integration tests for local/manual use only (`*/test/integration`).

## Root commands

Run from repo root:

```bash
pnpm test                     # same as test:unit
pnpm test:unit                # contracts + backend + setup + web-app unit tests
pnpm test:ci                  # test:unit + setup anvil smoke
pnpm test:integration:local   # live integration tests (gated by RUN_LIVE_PRIVIDIUM_TESTS=1)
```

## Package commands

- `backend`
  - `pnpm --filter sso-interop-backend test`
  - `pnpm --filter sso-interop-backend test:watch`
  - `pnpm --filter sso-interop-backend test:coverage`
  - `pnpm --filter sso-interop-backend test:integration`
- `setup`
  - `pnpm --filter prividium-setup test`
  - `pnpm --filter prividium-setup test:watch`
  - `pnpm --filter prividium-setup test:coverage`
  - `pnpm --filter prividium-setup test:anvil-smoke`
  - `pnpm --filter prividium-setup test:integration`
- `web-app`
  - `pnpm --filter web-app test`
  - `pnpm --filter web-app test:watch`
  - `pnpm --filter web-app test:coverage`
  - `pnpm --filter web-app test:integration`

## Environment handling

- Unit/component tests do not require your local `.env` to be fully populated.
- Test setup files provide deterministic defaults for required runtime values:
  - `backend/vitest.setup.ts`
  - `setup/vitest.setup.ts`
  - `web-app/vitest.setup.ts`
- You can override values inline when needed, for example:

```bash
PRIVIDIUM_API_URL=http://localhost:8000/api pnpm --filter sso-interop-backend test
```

## Live integration tests (local/manual)

- Integration suites are no-op unless `RUN_LIVE_PRIVIDIUM_TESTS=1`.
- They are intentionally excluded from PR CI because they require external/local Prividium services.
- Minimum expected services:
  - Prividium API (for `backend` and `setup` integration checks)
  - Backend API (for `web-app` integration checks)

Example:

```bash
RUN_LIVE_PRIVIDIUM_TESTS=1 pnpm test:integration:local
```

## CI behavior

- PR CI runs:
  - lint/check pipeline
  - `forge build` + `forge test`
  - unit/component tests with coverage reports for `backend`, `setup`, `web-app`
  - Anvil smoke deployment test (`setup test:anvil-smoke`)
- Coverage is report-only in phase 1 (artifact upload, no failure threshold yet).
