import { property, html, customElement, css } from 'lit-element';
import { PageViewElement } from 'components/page-view-element';

import { SharedStyles } from 'styles/shared-styles';
import { ExplorerStyles } from '../model-explore/explorer-styles'

import { store, RootState } from 'app/store';
import { connect } from 'pwa-helpers/connect-mixin';
import { goToPage } from 'app/actions';

import { renderNotifications } from "util/ui_renders";
import { showNotification, showDialog, hideDialog } from 'util/ui_functions';

import { processGet, processesGet, processPost, processPut, ALL_PROCESSES } from 'model-catalog/actions';

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

    @property({type: String})
    private _selectedProcessId: string = '';

    static get styles() {
        return [ExplorerStyles, SharedStyles, css`
        .process-container {
            display: grid;
            grid-template-columns: auto 28px;
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
        return Object.keys(this._selected).filter(processId => this._selected[processId]).map(processId => this._processes[processId]);
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
        let selectedProcess = this._processes[this._selectedProcessId];
        return html`
        <wl-dialog class="larger" id="processDialog" fixed backdrop blockscrolling persistent>
            <h3 slot="header">
                ${this._new ? 'Register a new process' : (selectedProcess ? 'Editing process' : 'Selecting processes')}
            </h3>
            <div slot="content">
                ${this._new ? html`
                <form>
                    <wl-textfield id="new-process-name" label="Name" required></wl-textfield>
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
                    ${Object.values(this._processes)
                        .filter(process => (process.label||[]).join().toLowerCase().includes(this._filter.toLowerCase()))
                        .map((process) => html`
                    <div class="process-container">
                        <label @click="${() => {this._toggleSelection(process.id)}}">
                            <wl-icon class="custom-checkbox">${this._selected[process.id] ? 'check_box' : 'check_box_outline_blank'}</wl-icon>
                            <span class="${this._selected[process.id] ? 'bold' : ''}">${process.label ? process.label : process.id}</span>
                        </label>
                        <wl-button @click="${() => this._edit(process.id)}" flat inverted><wl-icon>edit</wl-icon></wl-button>
                    </div>
                `)}
                ${this._loading ? html`<div style="text-align: center;"><wl-progress-spinner></wl-progress-spinner></div>` : ''}
                </div>
                or <a @click="${() => {this._new = true;}}">create a new Process</a>
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
        </wl-dialog>`
    }

    _toggleSelection (processId) {
        this._selected[processId] = !this._selected[processId];
        this.requestUpdate();
    }

    _onCreateProcess () {
        let nameEl = this.shadowRoot.getElementById('new-process-name') as Textfield;
        if (nameEl) {
            let name = nameEl.value;
            if (!name) {
                showNotification("formValuesIncompleteNotification", this.shadowRoot!);
                (<any>nameEl).refreshAttributes();
                return;
            }

            let newProcess : Process = {
                label: [name],
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

            let editedProcess : Process = Object.assign({}, this._processes[this._selectedProcessId])
            editedProcess.label = [name];

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
        if (this._new) {
            this._new = false;
        } else if (this._selectedProcessId) {
            this._selectedProcessId = '';
        } else {
            this.dispatchEvent(new CustomEvent('dialogClosed', {composed: true}));
            hideDialog("processDialog", this.shadowRoot);
        }
    }

    _edit (processId) {
        this._selectedProcessId = processId;
    }

    firstUpdated () {
        store.dispatch(processesGet());
    }

    stateChanged(state: RootState) {
        if (state.modelCatalog) {
            let db = state.modelCatalog;
            this._loading = db.loading[ALL_PROCESSES]
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
                        this._selectedProcessId = '';
                        this._waitingFor = '';
                    }
                }
            }
        }
    }
}
