import * as path from 'path';
import { FileEntry } from "ssh2-streams";
import * as vscode from 'vscode';
import { TreeItemCollapsibleState } from "vscode";
import { Command, NodeType } from "../common/constant";
import { Util } from '../common/util';
import { ViewManager } from '../common/viewManager';
import { ClientManager } from "../manager/clientManager";
import { FileManager, FileModel } from '../manager/fileManager';
import ServiceManager from '../manager/serviceManager';
import { TerminalService } from '../service/terminal/terminalService';
import { XtermTerminal } from '../service/terminal/xtermTerminalService';
import AbstractNode from "./abstracNode";
import { FileNode } from './fileNode';
import { SSHConfig } from "./sshConfig";

/**
 * contains connection and folder
 */
export class ParentNode extends AbstractNode {

    private terminalService: TerminalService = new XtermTerminal();

    constructor(readonly sshConfig: SSHConfig, readonly name: string, readonly file?: FileEntry, readonly parentName?: string, iconPath?: string) {
        super(name, TreeItemCollapsibleState.Collapsed);
        this.id = file ? `${sshConfig.username}@${sshConfig.host}_${sshConfig.port}_${parentName}.${name}` : name;
        this.fullPath = this.parentName + this.name;
        if (!file) {
            this.contextValue = NodeType.CONNECTION;
            this.iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `connection.svg`);
        } else {
            this.contextValue = NodeType.FOLDER;
            this.iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `folder.svg`);
        }
        if (file && file.filename.toLocaleLowerCase() == "home") {
            this.iconPath = `${ServiceManager.context.extensionPath}/resources/image/folder-core.svg`;
        } else if (iconPath) {
            this.iconPath = iconPath;
        }
    }

    public copyIP() {
        Util.copyToBoard(this.sshConfig.host)
    }

    private forwardService = new ForwardService()
    public fowardPort() {
        ViewManager.createWebviewPanel({
            splitView: false, path: "forward", title: `forward://${this.sshConfig.username}@${this.sshConfig.host}`,
            initListener: (viewPanel: vscode.WebviewPanel) => {
                viewPanel.webview.postMessage({ type: "title", content: this.sshConfig.host })
                viewPanel.webview.postMessage({ type: "forwardList", content: this.forwardService.list() })
            }, receiveListener: async (viewPanel: vscode.WebviewPanel, message: any) => {
                switch (message.type) {
                    case "start":
                        this.forwardService.start(this.sshConfig, message.content)
                        viewPanel.webview.postMessage({ type: "success" })
                        break;
                    case "stop":
                        this.forwardService.stop(message.content)
                        viewPanel.webview.postMessage({ type: "success" })
                        break;
                    case "remove":
                        this.forwardService.remove(message.content)
                        viewPanel.webview.postMessage({ type: "success" })
                        break;
                    case "create":
                        try {
                            await this.forwardService.forward(this.sshConfig, message.content)
                            viewPanel.webview.postMessage({ type: "success" })
                        } catch (err) {
                            viewPanel.webview.postMessage({ type: "error", content: err.message })
                        }
                        break;
                    case "reload":
                        viewPanel.webview.postMessage({ type: "forwardList", content: this.forwardService.list() })
                        break;
                }
            },
        })
    }

    public newFile(): any {
        vscode.window.showInputBox().then(async input => {
            if (input) {
                const { sftp } = await ClientManager.getSSH(this.sshConfig)
                const tempPath = await FileManager.record("temp/" + input, "", FileModel.WRITE);
                const targetPath = this.fullPath + "/" + input;
                sftp.fastPut(tempPath, targetPath, err => {
                    if (err) {
                        vscode.window.showErrorMessage(err.message)
                    } else {
                        vscode.commands.executeCommand(Command.REFRESH)
                    }
                })
            } else {
                vscode.window.showInformationMessage("Create File Cancel!")
            }
        })
    }

    public newFolder(): any {
        vscode.window.showInputBox().then(async input => {
            if (input) {
                const { sftp } = await ClientManager.getSSH(this.sshConfig)
                sftp.mkdir(this.fullPath + "/" + input, err => {
                    if (err) {
                        vscode.window.showErrorMessage(err.message)
                    } else {
                        vscode.commands.executeCommand(Command.REFRESH)
                    }
                })
            } else {
                vscode.window.showInformationMessage("Create Folder Cancel!")
            }
        })
    }

    upload(): any {
        vscode.window.showOpenDialog({ canSelectFiles: true, canSelectMany: false, canSelectFolders: false, openLabel: "Select Download Path" })
            .then(async uri => {
                if (uri) {
                    const { sftp } = await ClientManager.getSSH(this.sshConfig)
                    const targetPath = uri[0].fsPath;
                    const start = new Date()
                    vscode.window.showInformationMessage(`Start uploading ${targetPath}.`)
                    sftp.fastPut(targetPath, this.fullPath + "/" + path.basename(targetPath), err => {
                        if (err) {
                            vscode.window.showErrorMessage(err.message)
                        } else {
                            vscode.window.showInformationMessage(`Upload ${this.fullPath} success, cost time: ${new Date().getTime() - start.getTime()}`)
                            vscode.commands.executeCommand(Command.REFRESH)
                        }
                    })
                }
            })
    }

    delete(): any {
        vscode.window.showQuickPick(["YES", "NO"], { canPickMany: false }).then(async str => {
            if (str == "YES") {
                const { sftp } = await ClientManager.getSSH(this.sshConfig)
                sftp.rmdir(this.fullPath, (err) => {
                    if (err) {
                        vscode.window.showErrorMessage(err.message)
                    } else {
                        vscode.commands.executeCommand(Command.REFRESH)
                    }
                })
            }
        })
    }

    openTerminal(): any {
        this.terminalService.openMethod(this.sshConfig)
    }

    openInTeriminal(): any {
        this.terminalService.openPath(this.sshConfig, this.fullPath)
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
                const parent = this.file ? `${this.parentName + this.name}/` : '/';
                resolve(this.build(fileList, parent))
            })
        })
    }

    build(entryList: FileEntry[], parentName: string): AbstractNode[] {

        const folderList: ParentNode[] = []
        const fileList: FileNode[] = []

        for (const entry of entryList) {
            if (entry.longname.startsWith("d")) {
                folderList.push(new ParentNode(this.sshConfig, entry.filename, entry, parentName))
            } else if (entry.longname.startsWith("l")) {
                folderList.push(new ParentNode(this.sshConfig, entry.filename, entry, parentName))
            } else {
                fileList.push(new FileNode(this.sshConfig, entry, parentName))
            }
        }

        return [].concat(folderList.sort((a, b) => a.name.localeCompare(b.name)))
            .concat(fileList.sort((a, b) => a.file.filename.localeCompare(b.file.filename)));
    }

}
