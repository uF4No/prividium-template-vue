const defaults: Record<string, string> = {
  PRIVIDIUM_API_URL: 'http://localhost:8000/api',
  PRIVIDIUM_AUTH_BASE_URL: 'http://localhost:3001',
  PRIVIDIUM_RPC_URL: 'http://localhost:5050',
  PRIVIDIUM_CHAIN_ID: '6565'
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
