import { SSHConfig } from "../../node/sshConfig";

export interface TerminalService {
    openMethod(sshConfig: SSHConfig): void;
}