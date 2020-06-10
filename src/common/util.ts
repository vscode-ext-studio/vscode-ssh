import * as vscode from "vscode";

export enum Confirm {
    YES = "YES", NO = "NO"
}

export class Util {

    public static confirm(placeHolder: string, callback: () => void) {
        vscode.window.showQuickPick([Confirm.YES, Confirm.NO], { placeHolder }).then((res) => {
            if (res == Confirm.YES) {
                callback()
            }
        })
    }

    public static copyToBoard(content: string) {
        vscode.env.clipboard.writeText(content)
    }



    private static context: vscode.ExtensionContext
    public static initStroe(context: vscode.ExtensionContext) {
        this.context = context;
    }
    public static getStore(key: string): any {
        return this.context.globalState.get(key);
    }
    public static store(key: string, object: any) {
        this.context.globalState.update(key, object)
    }

}