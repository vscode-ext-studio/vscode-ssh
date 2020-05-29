import { SSHConfig } from "../../node/sshConfig";

export interface TerminalService {
    openPath(sshConfig: SSHConfig, fullPath: string): void;
    openMethod(sshConfig: SSHConfig): void;
}