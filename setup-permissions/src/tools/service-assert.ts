import { z } from 'zod';

export async function assertPrividiumApiUp(port: number) {
    try {
        const res = await fetch(new URL('/health', `http://localhost:${port}`));

        if (res.status !== 200) {
            console.error('Invalid response from prividium api. Please start local prividium api and try again');
            process.exit(1);
        }
    } catch {
        console.error('prividium api is down. Please start local prividium api and try again');
        process.exit(1);
    }
}

const chainIdSchema = z.object({
    result: z.coerce.bigint()
});

export async function assertZksyncOsIsUp(url: string) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                id: 'check-if-alive',
                jsonrpc: '2.0',
                method: 'eth_chainId',
                params: []
            })
        });

        if (res.status !== 200) {
            console.error('Invalid response from zksyncos. Cannot continue with setup.');
            process.exit(1);
        }

        const json = await res.json();
        const parsed = chainIdSchema.safeParse(json);

        if (!parsed.success) {
            console.error(`Unexpected response interacting with rpc: ${JSON.stringify(json)}`);
            process.exit(1);
        }
        if (parsed.data.result !== 6565n) {
            console.error(`Unexpected network id from zksyncos. expected: ${6565n} , received: ${parsed.data.result}`);
            process.exit(1);
        }
    } catch {
        console.error('zksyncos down. Please start deps and try again');
        process.exit(1);
    }
}
