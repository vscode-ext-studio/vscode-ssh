import { TreeItem } from "vscode";

export default abstract class AbstractNode extends TreeItem {
    abstract getChildren(): Promise<AbstractNode[]>;
}