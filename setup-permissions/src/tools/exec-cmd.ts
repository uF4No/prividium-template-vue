import { exec } from 'node:child_process';

export async function execCmd(cmd: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd }, (err, stdout) => {
            if (err !== null) {
                reject(err);
            }

            resolve(stdout);
        });
    });
}
