import * as vscode from 'vscode';
import * as path from 'path';
import { Event, EventEmitter, ExtensionContext, TreeDataProvider, window } from "vscode";
import { CacheKey, Command } from "../common/constant";
import { ParentNode } from "../node/parentNode";
import { SSHConfig } from "../node/sshConfig";
import AbstractNode from '../node/abstracNode';
import { ClientManager } from './clientManager';
import { ViewManager } from '../common/viewManager';
import { existsSync } from 'fs';


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
                const sshConfig = config[key];
                if (sshConfig.private && existsSync(sshConfig.private)) {
                    sshConfig.privateKey = require('fs').readFileSync(sshConfig.private)
                }
                return new ParentNode(sshConfig, key);
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

        ViewManager.createWebviewPanel({
            path: "connect", title: "Add SSH Config", splitView: false,
            receiveListener: (viewPanel, message: any) => {

                const sshConfig: SSHConfig = message.connectionOption
                let msg = null;
                if (!sshConfig.username) {
                    msg = "You must input username!"
                }
                if (!sshConfig.password && !sshConfig.private) {
                    msg = "You must input password!"
                }
                if (!sshConfig.host) {
                    msg = "You must input host!"
                }
                if (!sshConfig.port) {
                    msg = "You must input port!"
                }
                if (msg) {
                    viewPanel.webview.postMessage({
                        type: 'CONNECTION_ERROR',
                        err: msg,
                    });
                    return;
                }

                ClientManager.getSSH(sshConfig).then(() => {
                    const id = `${sshConfig.username}@${sshConfig.host}:${sshConfig.port}`;
                    const configs = this.getConnections();
                    configs[id] = sshConfig;
                    this.context.globalState.update(CacheKey.CONECTIONS_CONFIG, configs);
                    viewPanel.dispose();
                    this.refresh();
                }).catch(err => {
                    viewPanel.webview.postMessage({
                        type: 'CONNECTION_ERROR',
                        err
                    })
                })


            }
        })

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