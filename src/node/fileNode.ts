import * as path from 'path';
import { FileEntry } from "ssh2-streams";
import * as vscode from 'vscode';
import { TreeItemCollapsibleState } from "vscode";
import { Command, NodeType } from '../common/constant';
import { ClientManager } from '../manager/clientManager';
import { FileManager, FileModel } from '../manager/fileManager';
import AbstractNode from "./abstracNode";
import { SSHConfig } from "./sshConfig";
import ConnectionProvider from './connectionProvider';
import ServiceManager from '../manager/serviceManager';

const prettyBytes = require('pretty-bytes');

export class FileNode extends AbstractNode {
    contextValue = NodeType.FILE;
    fullPath: string;
    constructor(readonly sshConfig: SSHConfig, readonly file: FileEntry, readonly parentName: string) {
        super(file.filename, TreeItemCollapsibleState.None)
        this.description = prettyBytes(file.attrs.size)
        this.iconPath = this.getIcon(this.file.filename)
        this.fullPath = this.parentName + this.file.filename;
        this.command = {
            command: "ssh.file.open",
            arguments: [this],
            title: "Open File"
        }
    }

    public async getChildren(): Promise<AbstractNode[]> {
        return [];
    }
    delete(): any {
        vscode.window.showQuickPick(["YES", "NO"], { canPickMany: false }).then(async str => {
            if (str == "YES") {
                const { sftp } = await ClientManager.getSSH(this.sshConfig)
                sftp.unlink(this.fullPath, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage(err.message)
                    } else {
                        vscode.commands.executeCommand(Command.REFRESH)
                    }
                })
            }
        })
    }
    async open() {
        if (this.file.attrs.size > 10485760) {
            vscode.window.showErrorMessage("File size except 10 MB, not support open!")
            return;
        }
        const extName = path.extname(this.file.filename).toLowerCase();
        if (extName == ".gz" || extName == ".exe" || extName == ".7z" || extName == ".jar" || extName == ".bin" || extName == ".tar") {
            vscode.window.showErrorMessage(`Not support open ${extName} file!`)
            return;
        }
        const { sftp } = await ClientManager.getSSH(this.sshConfig)
        const tempPath = await FileManager.record(`temp/${this.file.filename}`, null, FileModel.WRITE);
        sftp.fastGet(this.fullPath, tempPath, async (err) => {
            if (err) {
                vscode.window.showErrorMessage(err.message)
            } else {
                ConnectionProvider.tempRemoteMap.set(path.resolve(tempPath), { remote: this.fullPath, sshConfig: this.sshConfig })
                vscode.commands.executeCommand('vscode.open', vscode.Uri.file(tempPath))
            }
        })
    }

    download(): any {

        vscode.window.showOpenDialog({ canSelectFiles: false, canSelectMany: false, canSelectFolders: true, openLabel: "Select Download Path" })
            .then(async uri => {
                if (uri) {
                    const { sftp } = await ClientManager.getSSH(this.sshConfig)
                    const start = new Date()
                    const targetPath = uri[0].fsPath + "/" + this.file.filename;

                    vscode.window.showInformationMessage(`Start downloading ${this.fullPath}.`)
                    sftp.fastGet(this.fullPath, targetPath, (err) => {
                        if (err) {
                            vscode.window.showErrorMessage(err.message)
                        } else {
                            vscode.window.showInformationMessage(`Download ${this.fullPath} success, cost time: ${new Date().getTime() - start.getTime()}`)
                        }
                    })

                }
            })
    }

    getIcon(fileName: string): string {

        const extPath = ServiceManager.context.extensionPath;

        const ext = path.extname(fileName).replace(".", "").toLowerCase()
        let fileIcon;
        switch (ext) {
            case 'pub': case 'pem': fileIcon = "key.svg"; break;
            case 'ts': fileIcon = "typescript.svg"; break;
            case 'log': fileIcon = "log.svg"; break;
            case 'sql': fileIcon = "sql.svg"; break;
            case 'xml': fileIcon = "xml.svg"; break;
            case 'html': fileIcon = "html.svg"; break;
            case 'java': case 'class': fileIcon = "java.svg"; break;
            case 'js': case 'map': fileIcon = "javascript.svg"; break;
            case 'json': fileIcon = "json.svg"; break;
            case 'sh': fileIcon = "console.svg"; break;
            case 'cfg': case 'conf': fileIcon = "settings.svg"; break;
            case 'rar': case 'zip': case '7z': case 'gz': case 'tar': fileIcon = "zip.svg"; break;
            default: fileIcon = "file.svg"; break;

        }

        return `${extPath}/resources/image/icon/${fileIcon}`
    }


}
