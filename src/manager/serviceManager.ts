import * as vscode from 'vscode';
import { Disposable, ExtensionContext } from "vscode";
import { ViewManager } from "../common/viewManager";
import ConnectionProvider from "./connectionProvider";

export default class ServiceManager {
    public provider: ConnectionProvider;
    private isInit = false;
    constructor(private context: ExtensionContext) {
    }

    public init(): Disposable[] {
        ViewManager.initExtesnsionPath(this.context.extensionPath)
        if (this.isInit) return []
        const res: Disposable[] = []
        this.provider = new ConnectionProvider(this.context)
        const treeview = vscode.window.createTreeView("github.cweijan.ssh", {
            treeDataProvider: this.provider
        });
        res.push(treeview)
        this.isInit = true
        return res
    }
}

