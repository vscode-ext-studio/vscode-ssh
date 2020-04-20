export interface SSHConfig {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: Buffer | string;
    passphrase?: string;
}

