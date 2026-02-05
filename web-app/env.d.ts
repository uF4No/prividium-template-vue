/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVIDIUM_RPC_URL: string;
  readonly VITE_AUTH_BASE_URL: string;
  readonly VITE_PRIVIDIUM_API_URL: string;
  readonly VITE_CLIENT_ID: string;
  readonly VITE_CHAIN_ID: string;
  readonly VITE_CHAIN_NAME: string;
  readonly VITE_NATIVE_CURRENCY_SYMBOL: string;
  readonly VITE_COUNTER_CONTRACT_ADDRESS: string;
  readonly VITE_COMPANY_NAME: string;
  readonly VITE_ACCENT_COLOR: string;
  readonly VITE_COMPANY_ICON: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  };
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
