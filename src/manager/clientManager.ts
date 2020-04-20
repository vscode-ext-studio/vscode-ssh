import * as vscode from 'vscode';
import { Client, SFTPWrapper } from "ssh2";
import { SSHConfig } from "../node/sshConfig";

class SSH {
    client: Client;
    sftp: SFTPWrapper;
}

export class ClientManager {

    private static activeClient: { [key: string]: SSH } = {};

    public static getSSH(sshConfig: SSHConfig): Promise<SSH> {

        const key = `${sshConfig.host}_${sshConfig.port}_${sshConfig.username}`;
        if (this.activeClient[key]) {
            return Promise.resolve(this.activeClient[key]);
        }

        const client = new Client();
        return new Promise((resolve) => {
            client.on('ready', () => {
                client.sftp((err, sftp) => {
                    if (err) throw err;
                    this.activeClient[key] = { client, sftp };
                    resolve(this.activeClient[key])
                })
            }).on('error', (err) => {
                vscode.window.showErrorMessage(err.message)
                resolve(null)
            }).on('end', () => {
                this.activeClient[key] = null
            }).connect(sshConfig);
        })

    }

}