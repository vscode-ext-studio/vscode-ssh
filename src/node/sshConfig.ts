export interface SSHConfig {
    /**
     * connection name
     */
    name?: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    /**
     * private key path
     */
    private?: string;
    /**
     * private key buffer
     */
    privateKey?: Buffer;
    passphrase?: string;
    algorithms?: Algorithms;
}

export interface Algorithms {
    cipher?: string[];
}