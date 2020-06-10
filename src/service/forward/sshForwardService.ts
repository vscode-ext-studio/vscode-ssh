import { SSHConfig } from "../../node/sshConfig";
import tunnel = require('tunnel-ssh')
import { ForwardService, ForwardInfo } from "./forwardService";
import { Console } from "../../common/outputChannel";

export class SSHForwardService extends ForwardService {

    private tunelMark: { [key: string]: { tunnel: any } } = {};

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
            const key = `${ssh.host}_${ssh.port}_${forwardInfo.localHost}_${forwardInfo.localPort}_${forwardInfo.remoteHost}_${forwardInfo.remotePort}`
            const localTunnel = tunnel(config, (error, server) => {
                this.tunelMark[key] = { tunnel: localTunnel }
                if (error) {
                    delete this.tunelMark[key]
                    reject(error)
                }
                resolve();
            });
            localTunnel.on('error', (err) => {
                Console.log('Ssh tunel occur error : ' + err);
                if (err) {
                    localTunnel.close()
                    delete this.tunelMark[key]
                    reject(err)
                }
                resolve()
            });
        })

    }



}