import { TreeItem } from "vscode";

export default abstract class AbstractNode extends TreeItem {
    fullPath: string;
    abstract getChildren(): Promise<AbstractNode[]>;
}