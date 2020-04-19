import * as path from 'path'
import { TreeItemCollapsibleState } from "vscode";
import AbstractNode from "./abstracNode";
import { SSHConfig } from "./sshConfig";
import { FileEntry } from "ssh2-streams";

export class FileNode extends AbstractNode {
    constructor(readonly sshConfig: SSHConfig,readonly file: FileEntry, readonly parentName: string) {
        super(file.filename, TreeItemCollapsibleState.None)
        this.iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `file.svg`);
    }

    public async getChildren(): Promise<AbstractNode[]> {
        return [];
    }
}
