import * as vscode from 'vscode';
import * as path from 'path';
import { FileEntry } from "ssh2-streams";
import { TreeItemCollapsibleState } from "vscode";
import { NodeType } from "../common/constant";
import { ClientManager } from "../manager/clientManager";
import AbstractNode from "./abstracNode";
import { FileNode } from './fileNode';
import { SSHConfig } from "./sshConfig";

/**
 * contains connection and folder
 */
export class ParentNode extends AbstractNode {
    openTerminal(): any {
        var sshterm = vscode.window.createTerminal(this.name);
        sshterm.sendText(`ssh ${this.sshConfig.username}@${this.sshConfig.host}`);
        sshterm.show();
        setTimeout(() => {
            sshterm.sendText(this.sshConfig.password);
        }, 1000)
    }
    constructor(readonly sshConfig: SSHConfig, readonly name: string, readonly file?: FileEntry, readonly parentName?: string) {
        super(name, TreeItemCollapsibleState.Collapsed);
        this.id = file ? `${sshConfig.username}@${sshConfig.host}_${sshConfig.port}_${parentName}.${name}` : name;
        if (!file) {
            this.contextValue = NodeType.CONNECTION;
            this.iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `connection.svg`);
        } else {
            this.contextValue = NodeType.FOLDER;
            this.iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `folder.svg`);
        }
    }

    async getChildren(): Promise<AbstractNode[]> {

        const ssh = await ClientManager.getSSH(this.sshConfig)
        return new Promise((resolve) => {
            if (ssh == null) {
                resolve(null);
                return;
            }
            ssh.sftp.readdir(this.file ? this.parentName + this.name : '/', (err, fileList) => {
                if (err) {
                    resolve([]);
                    return;
                }
                resolve(fileList.map((file) => {
                    const parentName = this.file ? `${this.parentName + this.name}/` : '/';
                    if (file.longname.startsWith("d")) {
                        return new ParentNode(this.sshConfig, file.filename, file, parentName)
                    } else if (file.longname.startsWith("l")) {
                        return new ParentNode(this.sshConfig, file.filename, file, parentName)
                    } else {
                        return new FileNode(this.sshConfig, file, parentName)
                    }
                }))
            })
        })
    }

}

export default ParentNode