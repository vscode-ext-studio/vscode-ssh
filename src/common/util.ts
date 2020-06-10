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

}