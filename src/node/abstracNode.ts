import { TreeItem } from "vscode";
import { Util } from "../common/util";

export default abstract class AbstractNode extends TreeItem {
    fullPath: string;
    abstract getChildren(): Promise<AbstractNode[]>;
    public copyPath() {
        Util.copyToBoard(this.fullPath)
    }
}