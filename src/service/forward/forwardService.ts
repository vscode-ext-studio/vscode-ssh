import { SSHConfig } from "../../node/sshConfig";
import tunnel = require('tunnel-ssh')
import { Console } from "../../common/outputChannel";

export class ForwardInfo {
    id: any;
    name: string;
    localHost: string;
    localPort: number;
    remoteHost: string;
    remotePort: number;
    state: boolean
}


export class ForwardService {

    private tunelMark: { [key: string]: { tunnel: any } } = {};

    public closeTunnel(connectId: string) {
        if (this.tunelMark[connectId]) {
            this.tunelMark[connectId].tunnel.close()
            delete this.tunelMark[connectId]
        }
    }

    public forward(ssh: SSHConfig, forwardInfo: ForwardInfo): Promise<void> {

        return new Promise((resolve, reject) => {

            if (forwardInfo.id != null) {
                this.remove(forwardInfo.id)
            }

            const config = {
                ...ssh,
                localHost: forwardInfo.localHost,
                localPort: forwardInfo.localPort,
                dstHost: forwardInfo.remoteHost,
                dstPort: forwardInfo.remotePort,
                privateKey: (() => {
                    if (ssh.private) {
                        return require('fs').readFileSync(ssh.private)
                    }
                })()
            };
            const id = `${ssh.host}_${ssh.port}_${forwardInfo.localHost}_${forwardInfo.localPort}_${forwardInfo.remoteHost}_${forwardInfo.remotePort}`
            const localTunnel = tunnel(config, (error, server) => {
                this.tunelMark[id] = { tunnel: localTunnel }
                if (error) {
                    delete this.tunelMark[id]
                    reject(error)
                }
                resolve();
                forwardInfo.id = id
                // add to config
            });
            localTunnel.on('error', (err) => {
                Console.log('Ssh tunel occur error : ' + err);
                if (err) {
                    localTunnel.close()
                    delete this.tunelMark[id]
                }
            });

        })

    }

    public stop(id: any): void {
        this.closeTunnel(id)
        // remove from config
    }



    public remove(id: any) {
        for (const forwardInfo of this.list()) {
            if (forwardInfo.id == id) {
                this.stop(id)
            }
        }
    }

    public async start(sshConfig: SSHConfig, id: any) {

        for (const forwardInfo of this.list()) {
            if (forwardInfo.id == id) {
                await this.forward(sshConfig, forwardInfo)
                return;
            }
        }

    }

    public list(): ForwardInfo[] {
        // get from config
        return [{
            id: 1,
            name: "elastic-search",
            localHost: "127.0.0.1",
            localPort: 22,
            remoteHost: "192.168.7.52",
            remotePort: 9200,
            state: true
        }]
    }

}