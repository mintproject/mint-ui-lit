import { customElement, LitElement, property, html, css } from "lit-element";
import { TreeNode } from './tree-node' ;

@customElement('tree-root')
export class TreeRoot extends TreeNode {
    private _input : HTMLElement;

    protected render() {
        return html`
            <wl-textfield label="Search models" @input=${this._onInput} id="search-input"
                    style="padding: 0px 10px 12px 10px; --input-font-size: 14px; --input-label-space: 10px;">
                <wl-icon slot="after">search</wl-icon>
            </wl-textfield>
            ${this._childs}
        `;
    }

    protected firstUpdated () {
        this._input = this.shadowRoot!.getElementById('search-input');
    }

    private _onInput () {
        let search = this._input['value'];
        if (search) {
            this._childs.forEach((c:TreeNode) => {
                c.setTextFilter(search)
                c.expand();
            });
        } else {
            this._childs.forEach((c:TreeNode) => c.clearTextFilter());
        }
    }
}
