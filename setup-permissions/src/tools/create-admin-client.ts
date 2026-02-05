import { ApiClient, postAuthLoginCryptoNative, postSiweMessages, extractRes } from './api-client';
import { privateKeyToAccount } from 'viem/accounts';

export type Client = ApiClient;

export async function createAdminApiClient(apiPort: number, siweDomain: string) {
    const baseUrl = `http://localhost:${apiPort}`;
    const anonApiClient = new ApiClient({ baseUrl });

    const viemAccount = privateKeyToAccount('0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6');

    const siweMsg = extractRes(
        await postSiweMessages(anonApiClient, {
            address: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
            domain: siweDomain
        })
    );

    const signature = await viemAccount.signMessage({ message: siweMsg.msg });

    const { token } = extractRes(
        await postAuthLoginCryptoNative(anonApiClient, {
            message: siweMsg.msg,
            signature
        })
    );

    return new ApiClient({
        baseUrl,
        headers: {
            authorization: `Bearer ${token}`
        }
    });
}
