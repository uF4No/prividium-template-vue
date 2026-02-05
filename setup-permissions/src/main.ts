import path from 'node:path';
import { createAdminApiClient } from './tools/create-admin-client';
import { setupCounterDapp } from './setups/counter-setup';
import { assertDotEnv, extractConfig } from './tools/config-tools';
import { assertPrividiumApiUp, assertZksyncOsIsUp } from './tools/service-assert';
import { intro, outro, spinner } from '@clack/prompts';

async function main() {
    intro('Starting Prividium setup...');

    const rootPath = path.join(import.meta.dirname, '..', '..');
    const webAppPath = path.join(rootPath, 'web-app');

    assertDotEnv(webAppPath);

    // Extract configuration from web-app .env
    const permissionsApiUrl = extractConfig(path.join(webAppPath, '.env'), 'VITE_PERMISSIONS_API_URL');
    const authBaseUrl = extractConfig(path.join(webAppPath, '.env'), 'VITE_AUTH_BASE_URL');
    const proxyUrl = extractConfig(path.join(webAppPath, '.env'), 'VITE_PROXY_URL');

    // Parse URLs to get ports and domains
    const apiPort = new URL(permissionsApiUrl).port || '8000';
    const authPort = new URL(authBaseUrl).port || '3001';
    const siweDomain = new URL(authBaseUrl).hostname;
    const zksyncOsUrl = proxyUrl.replace('/rpc', ''); // Remove /rpc suffix for health check

    console.log(`\nConfiguration:`);
    console.log(`  Permissions API: ${permissionsApiUrl}`);
    console.log(`  Auth Base URL: ${authBaseUrl}`);
    console.log(`  ZKsync OS URL: ${zksyncOsUrl}`);
    console.log(`  SIWE Domain: ${siweDomain}\n`);

    await assertPrividiumApiUp(Number(apiPort));
    await assertZksyncOsIsUp(zksyncOsUrl);

    const s = spinner();
    s.start('Authenticating as admin...');
    const adminApiClient = await createAdminApiClient(Number(apiPort), siweDomain);
    s.stop('Authenticated as admin!');

    console.log('\nDeploying Counter contract and configuring permissions...');
    await setupCounterDapp(adminApiClient);

    outro('Setup complete! 🎉\n\nYou can now run the web app with: pnpm dev');
}

main().catch((e) => {
    console.error('\n❌ Setup failed:');
    console.error(e);
    process.exit(1);
});
