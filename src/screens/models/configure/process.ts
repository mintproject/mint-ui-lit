import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { processGet, processesGet, processPost, processPut,  processDelete } from 'model-catalog/actions';

import { renderExternalLink } from './util';

import "weightless/progress-spinner";
import "weightless/textfield";
import "weightless/card";
import "weightless/dialog";
import "weightless/checkbox";
import 'components/loading-dots'
import { Process } from '@mintproject/modelcatalog_client';
import { Textfield } from 'weightless/textfield';

let identifierId : number = 1;
const nil = {};

@customElement('models-configure-process')
export class ModelsConfigureProcess extends connect(store)(PageViewElement) {
    @property({type: Boolean})
    private _new : boolean = false;

    @property({type: Boolean})
    private _loading : boolean = false;

    @property({type: Object})
    private _processes : {[key:string]: Process} = {};

    @property({type: String})
    private _filter : string = '';

    @property({type: Boolean})
    private _waiting : boolean = false;

    @property({type: String})
    private _waitingFor : string = '';

    @property({type: Object})
    private _selected : {[key:string]: boolean | undefined} = {};

    @property({type: Object})
    private _secondarySelected : {[key:string]: boolean | undefined} = {};

    @property({type: String})
    private _selectedProcessUri: string = '';

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        .process-container {
            display: grid;
            grid-template-columns: auto 28px 28px;
            border: 2px solid cadetblue;
            border-radius: 4px;
            line-height: 28px;
            padding: 1px 4px;
            margin-bottom: 5px;
        }

        .custom-checkbox {
            vertical-align: middle;
            margin-right: 10px;
        }

        wl-icon.warning:hover {
            color: darkred;
        }

        span.bold {
            font-weight: bold;
        }
        
        .process-container > wl-button {
            --button-padding: 5px;
        }

        .results {
            height: 400px;
            overflow-y: scroll;
        }
        `,
        ];
    }

    open () {
        if (this.active) {
            showDialog("processDialog", this.shadowRoot);
            this._filter = '';
        } else {
            setTimeout(() => {this.open()}, 300);
        }
    }

    setSelected (processes) {
        this._selected = {...processes};
    }

    getSelected () {
        return Object.keys(this._selected).filter(processUri => this._selected[processUri]).map(processUri => this._processes[processUri]);
    }

    _searchPromise = null;
    _onSearchChange () {
        let searchEl = this.shadowRoot.getElementById('search-input') as Textfield;
        if (this._searchPromise) {
            clearTimeout(this._searchPromise);
        }
        this._searchPromise = setTimeout(() => {
            this._filter = searchEl.value;
            console.log(searchEl.value);
            this._searchPromise = null;
        }, 300);
    }


    protected render() {
        //TODO: ADD influences
        let selectedProcess = this._processes && this._selectedProcessUri ? this._processes[this._selectedProcessUri] : null;
        return html`
        <wl-dialog class="larger" id="processDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                ${this._new ? 'Register a new process' : (selectedProcess ? 'Editing process' : 'Selecting processes')}
            </h3>
            <div slot="content">
                ${this._new ? html`
                <form>
                    <wl-textfield id="new-process-name" label="Name" required></wl-textfield>
                    <wl-textarea id="new-process-desc" label="Description"></wl-textarea>

                    <wl-textfield label="Process influecers" id="search-input" @input="${this._onSearchChange}">
                        <wl-icon slot="after">search</wl-icon>
                    </wl-textfield>
                    <div class="results" style="margin-top: 5px;">
                        ${Object.values(this._processes || nil)
                            .filter((process:Process) => (process.label||[]).join().toLowerCase().includes(this._filter.toLowerCase()))
                            .map((process:Process) => html`
                        <div class="process-container">
                            <label @click="${() => {this._toggleSecondarySelection(process.id)}}">
                                <wl-icon class="custom-checkbox">
                                    ${this._secondarySelected[process.id] ? 'check_box' : 'check_box_outline_blank'}
                                </wl-icon>
                                <span class="${this._secondarySelected[process.id] ? 'bold' : ''}">
                                    ${process.label ? process.label : process.id}
                                </span>
                            </label>
                        </div>`)}

                    </div>
                </form>`
                : (selectedProcess ? html`
                <div style="font-size: 12px; color: darkgray;">${selectedProcess.id}</div>
                <form>
                    <wl-textfield value="${selectedProcess.label ? selectedProcess.label : ''}"
                        id="edit-process-name" label="Name" required></wl-textfield>
                </form> `
                : html`
                <wl-textfield label="Search process" id="search-input" @input="${this._onSearchChange}"><wl-icon slot="after">search</wl-icon></wl-textfield>
                <div class="results" style="margin-top: 5px;">
                    ${Object.values(this._processes || nil)
                        .filter((process:Process) => (process.label||[]).join().toLowerCase().includes(this._filter.toLowerCase()))
                        .map((process:Process) => html`
                    <div class="process-container">
                        <label @click="${() => {this._toggleSelection(process.id)}}">
                            <wl-icon class="custom-checkbox">${this._selected[process.id] ? 'check_box' : 'check_box_outline_blank'}</wl-icon>
                            <span class="${this._selected[process.id] ? 'bold' : ''}">${process.label ? process.label : process.id}</span>
                        </label>
                        <wl-button @click="${() => this._edit(process.id)}" flat inverted><wl-icon>edit</wl-icon></wl-button>
                        <wl-button @click="${() => this._delete(process.id)}" flat inverted><wl-icon class="warning">delete</wl-icon></wl-button>
                    </div>
                `)}
                ${this._loading ? html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : ''}
                </div>
                or <a @click="${this._onNewButton}">create a new Process</a>
            `)}
            </div>
            <div slot="footer">
                <wl-button @click="${this._cancel}" style="margin-right: 5px;" inverted flat ?disabled="${this._waiting}">Cancel</wl-button>
                ${this._new ? html`
                <wl-button @click="${this._onCreateProcess}" class="submit" ?disabled="${this._waiting}">
                    Save & Select ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>`
                : (selectedProcess ? html`
                <wl-button @click="${this._onEditProcess}" class="submit" ?disabled="${this._waiting}">
                    Save & Select ${this._waiting ? html`<loading-dots style="--width: 20px; margin-left: 4px;"></loading-dots>` : ''}
                </wl-button>`
                : html`
                <wl-button @click="${this._onSubmitProcesses}" class="submit">Add selected processes</wl-button>`
                )}
            </div>
        </wl-dialog>
        ${renderNotifications()}`
    }

    _onNewButton () {
        this._new = true;
        this._secondarySelected = {};
    }

    _toggleSelection (processUri) {
        this._selected[processUri] = !this._selected[processUri];
        this.requestUpdate();
    }

    _toggleSecondarySelection (processUri) {
        this._secondarySelected[processUri] = !this._secondarySelected[processUri];
        this.requestUpdate();
    }

    _onCreateProcess () {
        let nameEl = this.shadowRoot.getElementById('new-process-name') as Textfield;
        let descEl = this.shadowRoot.getElementById('new-process-desc') as Textfield;
        if (nameEl) {
            let name = nameEl.value;
            let desc = descEl.value;
            if (!name) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                return;
            }

            let newProcess : Process = {
                label: [name]
            }
            if (desc) newProcess.description = [desc];
            let influences : Process [] = Object.keys(this._secondarySelected).filter(uri => this._secondarySelected[uri])
                    .map((uri:string) => { return {id: uri} as Process });
            if (influences.length > 0) {
                newProcess.influences = influences;
            }

            this._waitingFor = 'PostProcess' + identifierId;
            identifierId += 1;
            store.dispatch(processPost(newProcess, this._waitingFor));
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _onEditProcess () {
        let nameEl = this.shadowRoot.getElementById('edit-process-name') as Textfield
        if (nameEl) {
            let name = nameEl.value;
            if (!name) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                return;
            }

            let editedProcess : Process = Object.assign({}, this._processes[this._selectedProcessUri])
            editedProcess.label = [name];
            let influences : Process[] = Object.keys(this._secondarySelected).filter(uri => this._secondarySelected[uri])
                    .map((uri:string) => { return {id: uri} as Process });
            if (influences.length > 0) {
                editedProcess.influences = { ...editedProcess.influences, ...influences };
            }

            this._waitingFor = editedProcess.id;
            store.dispatch(processPut(editedProcess));
            showNotification("saveNotification", this.shadowRoot!);
        }
    }

    _onSubmitProcesses () {
        this.dispatchEvent(new CustomEvent('processesSelected', {composed: true}));
        hideDialog("processDialog", this.shadowRoot);
    }

    _cancel () {
        this._filter = '';
        this._secondarySelected = {};
        if (this._new) {
            this._new = false;
        } else if (this._selectedProcessUri) {
            this._selectedProcessUri = '';
        } else {
            this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
            hideDialog("processDialog", this.shadowRoot);
        }
    }

    _edit (processUri) {
        this._selectedProcessUri = processUri;
    }

    _delete (processUri) {
        if (confirm('This Process will be deleted on all related resources')) {
            store.dispatch(processDelete(processUri));
            if (this._selected[processUri])
                delete this._selected[processUri];
        }
    }

    firstUpdated () {
        this._loading = true;
        store.dispatch(processesGet()).then((processes) =>{
            this._loading = false;
        })
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            this._processes = db.processes;
            if (this._waitingFor) {
                if (this._new) {
                    if (db.created[this._waitingFor]) {
                        this._waiting = false;
                        this._selected[db.created[this._waitingFor]] = true;
                        this._new = false;
                        this._waitingFor = '';
                    } else {
                        this._waiting = true;
                    }
                } else {
                    this._waiting = db.loading[this._waitingFor];
                    if (this._waiting === false) {
                        this._selected[this._waitingFor] = true;
                        this._selectedProcessUri = '';
                        this._waitingFor = '';
                    }
                }
            }
        }
    }
}
