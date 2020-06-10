import { SSHConfig } from "../../node/sshConfig";

export class ForwardInfo {
    id: any;
    name: string;
    localHost: string;
    localPort: number;
    remoteHost: string;
    remotePort: number;
    state: boolean
}


export abstract class ForwardService {

    abstract forward(sshConfig: SSHConfig, forwardInfo: ForwardInfo): void | Promise<void>;

    list(): ForwardInfo[] {
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