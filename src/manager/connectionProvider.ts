import * as vscode from 'vscode';
import { Event, EventEmitter, ExtensionContext, TreeDataProvider, window } from "vscode";
import { CacheKey } from "../common/constant";
import {ParentNode} from "../node/parentNode";
import { SSHConfig } from "../node/sshConfig";
import AbstractNode from '../node/abstracNode';


export default class ConnectionProvider implements TreeDataProvider<AbstractNode> {
    _onDidChangeTreeData: EventEmitter<AbstractNode> = new EventEmitter<AbstractNode>();
    readonly onDidChangeTreeData: Event<AbstractNode> = this._onDidChangeTreeData.event;

    constructor(private context: ExtensionContext) { }
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
        } else if (password === '') {
            window.showInformationMessage("you must input password")
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