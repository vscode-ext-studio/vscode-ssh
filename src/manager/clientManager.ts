import * as vscode from 'vscode';
import { Client, SFTPWrapper } from "ssh2";
import { SSHConfig } from "../node/sshConfig";
import { existsSync, readFileSync } from 'fs';

class SSH {
    client: Client;
    sftp: SFTPWrapper;
}

export class ClientManager {

    private static activeClient: { [key: string]: SSH } = {};

    public static getSSH(sshConfig: SSHConfig,withSftp:boolean=true): Promise<SSH> {

        const key = `${sshConfig.host}_${sshConfig.port}_${sshConfig.username}`;
        if (this.activeClient[key]) {
            return Promise.resolve(this.activeClient[key]);
        }
        if (sshConfig.private && !sshConfig.privateKey && existsSync(sshConfig.private)) {
            sshConfig.privateKey = readFileSync(sshConfig.private)
        }

        const client = new Client();
        return new Promise((resolve, reject) => {
            client.on('ready', () => {
                if(withSftp){
                    client.sftp((err, sftp) => {
                        if (err) throw err;
                        this.activeClient[key] = { client, sftp };
                        resolve(this.activeClient[key])
                    })
                }else{
                    resolve({ client, sftp:null })
                }
                
            }).on('error', (err) => {
                vscode.window.showErrorMessage(err.message)
                reject(err)
            }).on('end', () => {
                this.activeClient[key] = null
            }).connect({ ...sshConfig, readyTimeout: 1000 * 10
                // fix no matching client->server cipher
            // ,algorithms:{cipher:[ "aes256-cbc"]}
            });
        })

    }

}