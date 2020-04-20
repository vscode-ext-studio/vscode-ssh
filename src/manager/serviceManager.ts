import * as vscode from 'vscode';
import { Disposable, ExtensionContext } from "vscode";
import { ViewManager } from "../common/viewManager";
import ConnectionProvider from "./connectionProvider";
import { FileManager } from './fileManager';

export default class ServiceManager {
    public static context: ExtensionContext;
    public provider: ConnectionProvider;
    private isInit = false;
    constructor(private context: ExtensionContext) {
        ServiceManager.context = context
        ViewManager.initExtesnsionPath(context.extensionPath)
        FileManager.init(context)
    }

    public init(): Disposable[] {
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

