import { SSHConfig } from "../../node/sshConfig";
import tunnel = require('tunnel-ssh')
import { Console } from "../../common/outputChannel";
import { Util } from "../../common/util";

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
    private store_key = "forward_store"

    public closeTunnel(connectId: string) {
        if (this.tunelMark[connectId]) {
            this.tunelMark[connectId].tunnel.close()
            delete this.tunelMark[connectId]
        }
    }

    public forward(ssh: SSHConfig, forwardInfo: ForwardInfo): Promise<void> {

        return new Promise((resolve, reject) => {

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
                const forwardInfos = this.list()
                forwardInfos.push(forwardInfo)
                Util.store(this.store_key, forwardInfos)
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
    }

    public remove(id: any) {
        const forwardInfos = this.list()
        for (let i = 0; i < forwardInfos.length; i++) {
            const forwardInfo = forwardInfos[i]
            if (forwardInfo.id == id) {
                this.stop(id)
                forwardInfos.splice(i, 1)
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
        const ForwardInfos: ForwardInfo[] = Util.getStore(this.store_key)
        for (const forwardInfos of ForwardInfos) {
            if (this.tunelMark[forwardInfos.id]) {
                forwardInfos.state = true;
            }
        }
        return ForwardInfos;
    }

}