import { customElement, LitElement, property, html, css } from "lit-element";

@customElement('tree-node')
export class TreeNode extends LitElement {
    static get styles() {
        return [css`
            .no-select {
              -webkit-touch-callout: none; /* iOS Safari */
                -webkit-user-select: none; /* Safari */
                 -khtml-user-select: none; /* Konqueror HTML */
                   -moz-user-select: none; /* Old versions of Firefox */
                    -ms-user-select: none; /* Internet Explorer/Edge */
                        user-select: none; /* Non-prefixed version, currently
                                              supported by Chrome, Edge, Opera and Firefox */
            }

            .node {
                width: 100%;
                overflow-x: hidden;
                display: grid;
                grid-template-columns: 24px auto 24px;
                align-items: center;
                grid-template-rows: auto;
                grid-template-areas: 
                  "expand title extra-icon"
                  "none content content";
            }

            .node.empty {
                grid-template-areas: 
                  "title title extra-icon"
                  "none none none"
            }

            .clickable {
                cursor: pointer;
            }

            .title {
                grid-area: title;
            }

            .content {
                grid-area: content;
            }

            .expand-icon {
                grid-area: expand;
                cursor: pointer;
            }

        `];
    }

    @property({type:Boolean}) private _expanded: boolean = true;
    @property({type:String}) public name: string = 'example';

    private _childs : TreeNode[] = [];

    public expand () : void {
        this._expanded = true;
    }

    public contract () : void {
        this._expanded = false;
    }

    public toggle () : void {
        if (this._expanded) this.contract();
        else this.expand();
    }

    public isExpanded () : boolean {
        return this._expanded;
    }

    public addChild (node: TreeNode) : void {
        if (this._childs.indexOf(node) < 0) {
            this._childs.push(node);
            this.requestUpdate();
        }
    }

    public hasNode (node: TreeNode) : boolean {
        return this._childs.indexOf(node) >= 0;
    }

    public getName () {
        return html`${this.name}`
    }

    public onClick : null | (() => void) = null;

    protected render() {
        return html`
            <div class="node ${this._childs.length === 0 ? 'empty' : ''}">
                <span class="title ${this.onClick? 'clickable' : ''}" @click=${this.onClick}>
                    ${this.getName()}
                </span>
                ${this._childs.length > 0 ? html`
                <wl-icon class="expand-icon no-select" @click="${this.toggle}">
                    ${this._expanded ? 'expand_more' : 'expand_less'}
                </wl-icon>
                ` : ''}
                ${this._expanded ? html`
                <div class="content">
                    ${this._childs}
                </div>
                ` : ''}
            </div>
        `;
    }

    public refresh () {
        this.requestUpdate();
    }
}
