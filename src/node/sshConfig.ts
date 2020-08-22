export interface SSHConfig {
    /**
     * connection name
     */
    name?: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    private?: string;
    privateKey?: Buffer;
    passphrase?: string;
}

