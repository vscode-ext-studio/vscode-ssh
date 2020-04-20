import * as fs from "fs";
import * as vscode from "vscode";
import { WebviewPanel } from "vscode";
import { Console } from "./OutputChannel";

export class ViewOption {
    public viewType: string;
    public viewPath?: string;
    public viewTitle?: string;
    public splitResultView: boolean;
    /**
     * keep single page by viewType
     */
    public singlePage?: boolean;
    /**
     * kill exists panel
     */
    public killHidden?: boolean;
    /**
     * receive webview send message 
     */
    public receiveListener?: (viewPanel: WebviewPanel, message: any) => void;
    /**
     * callback when init success.
     */
    public initListener?: (viewPanel: WebviewPanel) => void;
}

export class ViewManager {

    private static extensionPath: string;
    private static viewStatu: { [key: string]: { instance: WebviewPanel, creating: boolean, receiveListener: (viewPanel: WebviewPanel, message: any) => void } } = {};
    public static initExtesnsionPath(extensionPath: string) {
        this.extensionPath = extensionPath;
    }

    /**
     * not return webviewPanel beause message send have delay.
     * @param viewOption 
     */
    public static createWebviewPanel(viewOption: ViewOption): Promise<void> {
        // TODO creating 应该return 
        if (typeof (viewOption.singlePage) == 'undefined') viewOption.singlePage = true
        if (typeof (viewOption.killHidden) == 'undefined') viewOption.killHidden = true

        const currentStatus = this.viewStatu[viewOption.viewType]
        if (viewOption.singlePage && currentStatus && !currentStatus.creating) {
            if (viewOption.killHidden && currentStatus.instance.visible == false) {
                currentStatus.instance.dispose()
            } else {
                viewOption.initListener(currentStatus.instance)
                if (viewOption.receiveListener) currentStatus.receiveListener = viewOption.receiveListener
                return Promise.resolve(null);
            }
        }

        const columnType = viewOption.splitResultView ? vscode.ViewColumn.Two : vscode.ViewColumn.One;

        return new Promise((resolve, reject) => {
            fs.readFile(`${this.extensionPath}/src/webview/${viewOption.viewPath}.html`, 'utf8', async (err, data) => {
                if (err) {
                    Console.log(err);
                    reject(err);
                    return;
                }
                const webviewPanel = vscode.window.createWebviewPanel(
                    viewOption.viewType,
                    viewOption.viewTitle,
                    { viewColumn: columnType, preserveFocus: true },
                    { enableScripts: true, retainContextWhenHidden: true },
                );
                webviewPanel.webview.html = data.replace(/("|')\/?(css|js)\b/gi,
                    "$1" + vscode.Uri.file(`${this.extensionPath}/src/webview`)
                        .with({ scheme: 'vscode-resource' }).toString() + "/$2");
                ViewManager.viewStatu[viewOption.viewType] = {
                    creating: true,
                    instance: webviewPanel,
                    receiveListener: viewOption.receiveListener
                }
                webviewPanel.onDidDispose(() => {
                    ViewManager.viewStatu[viewOption.viewType] = null
                })
                const newStatus = ViewManager.viewStatu[viewOption.viewType]
                webviewPanel.webview.onDidReceiveMessage((message) => {
                    if (message.type == 'init') {
                        newStatus.creating = false
                        if (viewOption.initListener) { viewOption.initListener(webviewPanel) }
                    } else if (newStatus.receiveListener) {
                        newStatus.receiveListener(webviewPanel, message)
                    }
                })
                resolve(null);
            });

        });

    }

}