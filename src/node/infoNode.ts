import { setupMaster } from "cluster";
import { TreeItemCollapsibleState, Uri } from "vscode";
import { version } from "vue/types/umd";
import { NodeType } from "../common/constant";
import { Util } from "../common/util";
import AbstractNode from "./abstracNode";

export class InfoNode extends AbstractNode {
    contextValue = NodeType.INFO;
    constructor(info: string) {
        super(info)
        this.collapsibleState = TreeItemCollapsibleState.None
    }
    getChildren(): Promise<AbstractNode[]> {
        return null;
    }
}

export class LinkNode extends AbstractNode {
    contextValue = NodeType.Link;
    constructor(info: string) {
        super(info)
        this.iconPath={
            light: Util.getExtPath("resources", "image", "light", "link.svg"),
            dark: Util.getExtPath("resources", "image","dark", "link.svg"),
        }
        this.collapsibleState = TreeItemCollapsibleState.None
    }
    getChildren(): Promise<AbstractNode[]> {
        return null;
    }
}