import {
  TemplateResult,
  customElement,
  LitElement,
  property,
  html,
  css,
} from "lit-element";

@customElement("tree-node")
export class TreeNode extends LitElement {
  static get styles() {
    return [
      css`
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
            "expand title select"
            "none content content";
        }

        .clickable {
          cursor: pointer;
        }

        .title {
          grid-area: title;
          color: var(--text-color, initial);
          min-height: 21px;
          line-height: 21px;
        }

        .title.selected {
          grid-area: title;
          font-weight: bold;
        }

        .content {
          grid-area: content;
        }

        .select-icon {
          grid-area: select;
        }

        .expand-icon {
          grid-area: expand;
          cursor: pointer;
          text-align: center;
        }

        .expand-icon.empty {
          font-size: 12px;
        }

        span.tag {
          border: 1px solid;
          border-radius: 3px;
          padding: 0px 3px;
          font-weight: bold;
          border-color: var(--tag-background-color, grey);
          background: var(--tag-background-color, grey);
          color: var(--tar-foreground-color, white);
        }
      `,
    ];
  }

  @property({ type: Boolean }) private _expanded: boolean = true;
  @property({ type: Boolean }) private _selected: boolean = false;
  @property({ type: Boolean }) public selectIcon: boolean = true;
  @property({ type: String }) public name: string = "";
  @property({ type: String }) public tag: string = "";
  @property({ type: String }) public tagIcon: string = "";
  @property({ type: String }) public textFilter: string = "";

  public setName(name: string): void {
    this.name = name;
  }

  public setTag(tag: string): void {
    this.tag = tag;
  }

  public setTagIcon(tagIcon): void {
    this.tagIcon = tagIcon;
  }

  protected _childs: TreeNode[] = [];

  public expand(): void {
    this._expanded = true;
  }

  public contract(): void {
    this._expanded = false;
  }

  public toggle(): void {
    if (this._expanded) this.contract();
    else this.expand();
  }

  public isExpanded(): boolean {
    return this._expanded;
  }

  public select(): void {
    this._selected = true;
  }

  public unselect(): void {
    this._selected = false;
  }

  public getSelectedNodes() {
    return [];
  }

  public setTextFilter(filter: string): void {
    this.textFilter = filter.toLowerCase();
  }

  public clearTextFilter(): void {
    this.textFilter = "";
  }

  public addChild(node: TreeNode): void {
    if (this._childs.indexOf(node) < 0) {
      this._childs.push(node);
      this.requestUpdate();
    }
  }

  public hasNode(node: TreeNode): boolean {
    return this._childs.indexOf(node) >= 0;
  }

  public getName(): TemplateResult {
    return html`${this.name}`;
  }

  public onClick: null | (() => void) = null;

  protected render() {
    let isEmpty: boolean = this._childs.length === 0;
    return html`
      <div class="node">
        <span
          class="title ${this.onClick ? "clickable" : ""} ${this._selected
            ? "selected"
            : ""}"
          @click=${this.onClick}
        >
          ${this.tagIcon
            ? html`<wl-icon style="width: 20px;">${this.tagIcon}</wl-icon>`
            : this.tag
            ? html`<span class="tag">${this.tag}</span>`
            : ""}
          ${this.getName()}
        </span>
        ${this.selectIcon && this._selected
          ? html`<wl-icon class="select-icon">check</wl-icon>`
          : ""}
        <wl-icon
          class="expand-icon no-select ${isEmpty ? "empty" : ""}"
          @click="${isEmpty ? this.onClick : this.toggle}"
        >
          ${isEmpty
            ? "fiber_manual_record"
            : this._expanded
            ? "expand_more"
            : "expand_less"}
        </wl-icon>
        ${this._expanded
          ? html`
              <div class="content">
                ${this.textFilter ? this.getFilteredChilds() : this._childs}
              </div>
            `
          : ""}
      </div>
    `;
  }

  public getFilteredChilds() {
    return this._childs.filter((c: TreeNode) =>
      c.name.toLowerCase().includes(this.textFilter)
    );
  }

  public refresh() {
    this.requestUpdate();
  }
}
