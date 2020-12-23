export enum NodeType {
    CONNECTION = 'connection', FOLDER = 'folder', FILE = "file",INFO = "info"
}

export enum CacheKey {
    CONECTIONS_CONFIG = "ssh.connections",
    COLLAPSE_SATE = "ssh.cache.collapseState",
}


export enum Command {
    REFRESH = "ssh.refresh"
}

export enum ResultType {
    DETAIL = "detail"
}
