import { customElement, LitElement, property, html, css } from "lit-element";
import { TreeNode } from './tree-node' ;

@customElement('tree-root')
export class TreeRoot extends TreeNode {
    protected render() {
        return html`${this._childs}`;
    }
}
