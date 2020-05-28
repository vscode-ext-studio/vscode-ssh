import { SSHConfig } from "../../node/sshConfig";

export interface TerminalService {
    openMethod(sshConfig: SSHConfig, sessinoName: string): void;
}