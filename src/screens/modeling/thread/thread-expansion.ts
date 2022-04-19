import { customElement, html, css, property, TemplateResult } from "lit-element";
import { connect } from "pwa-helpers/connect-mixin";
import { store, RootState } from "../../../app/store";

import { SharedStyles } from "../../../styles/shared-styles";

import "weightless/title";
import "weightless/expansion";
import "weightless/icon";
import "weightless/button";

import { MintThreadPage } from "./mint-thread-page";
import { Thread } from "../reducers";

type StatusType = "warning" | "done" | "error";

@customElement('thread-expansion')
export class ThreadExpansion extends connect(store)(MintThreadPage) {
    @property({type: Boolean}) protected editMode: boolean = false;
    @property({type: Boolean}) public loading: boolean = false;
    @property({type: Boolean}) public open: boolean = false;
    @property({type: Boolean}) public isSaved: boolean = false;
    protected _name : string = "Configure";
    protected _description : TemplateResult = html`General configuration for this thread.
        The parameters you set here will be used to filter the models and datasets available on next steps.`;

    static generalStyles = css`
        .expansion-title {
            display: flex;
            align-items: center;
        }
        .expansion-title > wl-icon {
            margin-right: 10px;
        }
        wl-icon.warning {
            color: orange;
        }
        wl-icon.error {
            color:red;
        }
        wl-icon.done {
            color:green;
        }
        .loading-screen {
            position: absolute;
            left: 0em;
            width: 100%;
            height: calc(100% - 56px); /* Heigh of the header: 56px */
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(124,124,124,0.5);
        }
        .expansion {
            border-bottom: 1px solid lightgray;
            margin-bottom: 5px;
        }
        `;

    static get styles() {
        return [SharedStyles, this.generalStyles];
    }

    constructor () {
        super();
        this.active = true;
    }

    private disableSpace (e:KeyboardEvent) : void {
        if (e.key && e.key === ' ') {
            e.stopPropagation();
        }
    }

    public render () : TemplateResult {
        return html`
        <wl-expansion .checked=${this.open} @change=${this.onVisibilityChange} 
                class="expansion ${this.editMode ? "edit" : ""}">
            <div slot="title" class="expansion-title">
                <wl-icon class=${this.getStatus()}>${this.getStatus()}</wl-icon>
                <b>${this._name}</b>
            </div>
            <span slot="description" style="overflow: hidden; text-overflow: ellipsis;">
                ${this.getStatusInfo()}
            </span>
            <div @keydown=${this.disableSpace}>
                <div style="visibility: ${this.loading && this.open ? "visible" : "hidden" }" class="loading-screen"><wl-progress-spinner></wl-progress-spinner></div>
                <hr style="margin: 0px -23px 5px;">
                <div style="display:flex; align-items: center; justify-content: space-between;">
                    <p>${this._description}</p>
                    ${this.permission && this.permission.write && !this.editMode ? html`
                    <wl-button flat @click="${this.onEditEnable}">
                        <wl-icon id="editModelsIcon" class="actionIcon editIcon">edit</wl-icon>
                    </wl-button>` 
                    : html`<span></span>`}
                </div>
                ${this.thread ?  (this.editMode ? this.renderEditForm() :  this.renderView()) : "" }
                ${this.editMode ? html `
                    <div class="footer">
                        <wl-button @click="${this.onCancelClicked}" flat inverted>CANCEL</wl-button>
                        <wl-button type="button" class="submit" @click="${this.onSaveClicked}" ?disabled=${this.loading}>
                            <wl-icon style="margin-right:4px">save</wl-icon>
                            Save
                        </wl-button>
                    </div>` : ""
                }
            </div>
            </wl-expansion>
        `;
    }

    protected onVisibilityChange (e:CustomEvent) : void {
        this.open = e.detail;
        if (this.open) this.onOpen();
        else this.onClose();

    }

    private header : HTMLElement;
    protected update(changedProperties: Map<string | number | symbol, unknown>): void {
        if (!this.header) {
            let ex : Element = this.shadowRoot!.querySelector("wl-expansion");
            if (ex) {
                this.header = ex.shadowRoot!.querySelector<HTMLElement>("#header");
            }
        }
        if (this.header && changedProperties.has("editMode")) {
            this.header.style.background = this.editMode ? "lightyellow" : "unset";
        }
        super.update(changedProperties);
    }

    public getStatus () : StatusType {
        return "warning";
    }

    protected getStatusInfo () : string {
        return "Add thread details";
    }

    protected onEditEnable () : void {
        this.editMode = true;
    }

    public setEditMode (b:boolean) : void {
        if (b) this.onEditEnable();
        else this.onCancelClicked();
    }

    protected onCancelClicked () : void {
        this.editMode = false;
    }

    protected onSaveClicked () : void {
        // Example
        this.loading = true;
        setTimeout(() => {this.loading = false; this.editMode = false;}, 1000);
    }

    protected renderView () : TemplateResult {
        return html`A`;
    }

    protected renderEditForm () : TemplateResult {
        return html`B`;
    }

    protected onThreadChange (thread:Thread) : void {}
    protected onOpen () : void {}
    protected onClose () : void {}

    private _lastThread : Thread = null;
    stateChanged(state: RootState) {
        super.setUser(state);
        if (super.setThread(state)) {
            //Saved
        }
        if (this._lastThread != this.thread) {
            this.onThreadChange(this.thread);
            this._lastThread = this.thread;
        }
    }
}