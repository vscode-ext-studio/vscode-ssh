import * as vscode from 'vscode';
import * as path from 'path';
import { Event, EventEmitter, ExtensionContext, TreeDataProvider, window } from "vscode";
import { CacheKey, Command } from "../common/constant";
import { ParentNode } from "../node/parentNode";
import { SSHConfig } from "../node/sshConfig";
import AbstractNode from '../node/abstracNode';
import { ClientManager } from './clientManager';


export default class ConnectionProvider implements TreeDataProvider<AbstractNode> {
    _onDidChangeTreeData: EventEmitter<AbstractNode> = new EventEmitter<AbstractNode>();
    readonly onDidChangeTreeData: Event<AbstractNode> = this._onDidChangeTreeData.event;
    public static tempRemoteMap = new Map<string, { remote: string, sshConfig: SSHConfig }>()

    constructor(private context: ExtensionContext) {
        vscode.workspace.onDidSaveTextDocument(e => {
            const tempPath = path.resolve(e.fileName);
            const data = ConnectionProvider.tempRemoteMap.get(tempPath)
            if (data) {
                this.saveFile(tempPath, data.remote, data.sshConfig)
            }
        })
    }
    getTreeItem(element: AbstractNode): vscode.TreeItem {
        return element;
    }

    // usage: https://www.npmjs.com/package/redis
    async getChildren(element?: AbstractNode) {
        if (!element) {
            const config = this.getConnections();
            const nodes = Object.keys(config).map(key => {
                return new ParentNode(config[key], key);
            });
            return nodes
        } else {
            return element.getChildren()
        }
    }

    async saveFile(tempPath: string, remotePath: string, sshConfig: SSHConfig) {
        const { sftp } = await ClientManager.getSSH(sshConfig)
        sftp.fastPut(tempPath, remotePath, async (err) => {
            if (err) {
                vscode.window.showErrorMessage(err.message)
            } else {
                vscode.commands.executeCommand(Command.REFRESH)
                vscode.window.showInformationMessage("Update to remote success!")
            }
        })
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    async add() {
        let host = await window.showInputBox({ prompt: "The hostname of the redis.", placeHolder: "host (default 127.0.0.1)", ignoreFocusOut: true });
        if (host === undefined) {
            return;
        } else if (host === '') {
            host = '127.0.0.1';
        }

        let port = await window.showInputBox({ prompt: "The port number to connect to.", placeHolder: "port (default 22)", ignoreFocusOut: true });
        if (port === undefined) {
            return;
        } else if (port === '') {
            port = '22';
        }
        let username = await window.showInputBox({ prompt: "The username to connect to.", placeHolder: "The username to connect to.", ignoreFocusOut: true });
        if (username === undefined) {
            return;
        } else if (username === '') {
            window.showInformationMessage("you must input username")
            return;
        }

        let password = await window.showInputBox({ prompt: "The password to connect to.", placeHolder: "The password to connect to.", ignoreFocusOut: true });
        if (password === undefined) {
            return;
        }

        const id = `${username}@${host}:${port}`;

        const redisConfig = { host, port: parseInt(port), username, password }

        const configs = this.getConnections();
        configs[id] = redisConfig;
        this.context.globalState.update(CacheKey.CONECTIONS_CONFIG, configs);

        this.refresh();
    }

    delete(element: ParentNode) {
        const configs = this.getConnections();
        delete configs[element.id];
        this.context.globalState.update(CacheKey.CONECTIONS_CONFIG, configs);
        this.refresh();
    }

    private getConnections(): { [key: string]: SSHConfig } {
        return this.context.globalState.get<{ [key: string]: SSHConfig }>(CacheKey.CONECTIONS_CONFIG) || {};
    }

}