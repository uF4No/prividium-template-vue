import type { Hex } from 'viem';
import { getPrividiumAuthToken } from '../client';
import { env } from '../envConfig';

type UserWalletRecord = {
  walletAddress: string;
};

type UserProfileRecord = {
  id: string;
  wallets?: UserWalletRecord[];
};

type UpdateUserWalletsPayload = {
  wallets: string[];
};

function buildApiUrl(path: string, apiBaseUrl: string) {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export type AssociateWalletDeps = {
  getPrividiumAuthToken: typeof getPrividiumAuthToken;
  fetchFn: typeof fetch;
  apiBaseUrl: string;
};

function getAssociationDeps(overrides: Partial<AssociateWalletDeps>): AssociateWalletDeps {
  return {
    getPrividiumAuthToken,
    fetchFn: fetch,
    apiBaseUrl: env.PRIVIDIUM_API_URL,
    ...overrides
  };
}

export async function associateWalletWithUser(
  userId: string,
  walletAddress: Hex,
  deps: Partial<AssociateWalletDeps> = {}
) {
  const mergedDeps = getAssociationDeps(deps);
  const token = await mergedDeps.getPrividiumAuthToken();
  const userUrl = buildApiUrl(`/users/${encodeURIComponent(userId)}`, mergedDeps.apiBaseUrl);

  const getResponse = await mergedDeps.fetchFn(userUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!getResponse.ok) {
    const body = await getResponse.text().catch(() => '');
    throw new Error(
      `Failed to fetch user ${userId}: ${getResponse.status} ${getResponse.statusText} ${body}`
    );
  }

  const user = (await getResponse.json()) as UserProfileRecord;
  const existingWallets = (user.wallets ?? []).map((entry) => entry.walletAddress);
  const walletExists = existingWallets.some(
    (entry) => normalizeAddress(entry) === normalizeAddress(walletAddress)
  );

  if (walletExists) {
    return {
      alreadyLinked: true,
      wallets: existingWallets
    };
  }

  const payload: UpdateUserWalletsPayload = {
    wallets: [...existingWallets, walletAddress]
  };

  const putResponse = await mergedDeps.fetchFn(userUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!putResponse.ok) {
    const body = await putResponse.text().catch(() => '');
    throw new Error(
      `Failed to associate wallet ${walletAddress} to user ${userId}: ${putResponse.status} ${putResponse.statusText} ${body}`
    );
  }

  const updatedUser = (await putResponse.json().catch(() => null)) as UserProfileRecord | null;
  const updatedWallets = (updatedUser?.wallets ?? []).map((entry) => entry.walletAddress);

  return {
    alreadyLinked: false,
    wallets: updatedWallets.length > 0 ? updatedWallets : payload.wallets
  };
}
